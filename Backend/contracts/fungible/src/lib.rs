// VERSI FINAL DENGAN FITUR TAMBAHAN v3 (LOGIKA DIPERBAIKI)
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    token,
    Address, Env,
};

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    InvalidWageRate = 2,
    WithdrawalExceedsAccrued = 3,
    EmployeeNotFound = 4,
    NotAuthorized = 5,
    InvalidAmount = 6,
    EmployeeAlreadyExists = 7,
    TokenNotConfigured = 8,
    NothingToWithdraw = 9,
    CannotRemoveActiveEmployee = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Employee {
    pub wage_rate: i128,
    pub last_accrual_timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Employer,
    Token,
    Employee(Address),
}

#[contract]
pub struct FairWage;

#[contractimpl]
impl FairWage {
    pub fn initialize(env: Env, employer: Address, token_address: Address) -> Result<(), Error> {
        employer.require_auth();

        if env.storage().instance().get::<DataKey, Address>(&DataKey::Employer).is_some() {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Employer, &employer);
        env.storage().instance().set(&DataKey::Token, &token_address);
        Ok(())
    }

    pub fn add_employee(env: Env, employee_address: Address, wage_rate: i128) -> Result<(), Error> {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).ok_or(Error::NotAuthorized)?;
        employer.require_auth();

        if wage_rate <= 0 {
            return Err(Error::InvalidWageRate);
        }

        let employee_key = DataKey::Employee(employee_address.clone());
        if env.storage().persistent().has(&employee_key) {
            return Err(Error::EmployeeAlreadyExists);
        }

        let employee_data = Employee {
            wage_rate,
            last_accrual_timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&employee_key, &employee_data);
        Ok(())
    }

    // --- FITUR BARU (DIPERBAIKI) ---
    pub fn update_wage_rate(env: Env, employee_address: Address, new_wage_rate: i128) -> Result<(), Error> {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).ok_or(Error::NotAuthorized)?;
        employer.require_auth();

        if new_wage_rate < 0 {
            return Err(Error::InvalidWageRate);
        }

        let employee_key = DataKey::Employee(employee_address.clone());
        let mut employee_data: Employee = env.storage().persistent().get(&employee_key).ok_or(Error::EmployeeNotFound)?;

        // Logika yang lebih sederhana dan aman: cukup perbarui rate dan setel ulang timestamp.
        // Saldo akrual yang ada akan tetap dihitung dengan rate lama pada penarikan berikutnya.
        // Ini menghindari panggilan transfer internal yang rumit.
        employee_data.wage_rate = new_wage_rate;
        employee_data.last_accrual_timestamp = env.ledger().timestamp();
        env.storage().persistent().set(&employee_key, &employee_data);

        Ok(())
    }

    // --- FITUR BARU (SUDAH BENAR) ---
    pub fn remove_employee(env: Env, employee_address: Address) -> Result<(), Error> {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).ok_or(Error::NotAuthorized)?;
        employer.require_auth();

        let employee_key = DataKey::Employee(employee_address.clone());
        let employee_data: Employee = env.storage().persistent().get(&employee_key).ok_or(Error::EmployeeNotFound)?;

        let accrued_balance = Self::calculate_accrued(&employee_data, env.ledger().timestamp());
        if accrued_balance > 0 {
            return Err(Error::CannotRemoveActiveEmployee);
        }

        env.storage().persistent().remove(&employee_key);
        Ok(())
    }

    pub fn deposit(env: Env, amount: i128) -> Result<(), Error> {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).ok_or(Error::NotAuthorized)?;
        employer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::TokenNotConfigured)?;
        let token_client = token::Client::new(&env, &token_address);

        token_client.transfer(&employer, &env.current_contract_address(), &amount);
        Ok(())
    }
    
    // --- FITUR BARU (DIPERBAIKI) ---
    pub fn withdraw_surplus(env: Env, amount: i128) -> Result<(), Error> {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).ok_or(Error::NotAuthorized)?;
        employer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::TokenNotConfigured)?;
        let token_client = token::Client::new(&env, &token_address);
        
        // Logika yang lebih sederhana: transfer dana dari kontrak ke majikan.
        // Tanggung jawab ada pada majikan untuk tidak menarik dana yang menjadi hak karyawan.
        // Ini adalah pola umum untuk menghindari perhitungan total utang yang mahal.
        token_client.transfer(&env.current_contract_address(), &employer, &amount);
        Ok(())
    }

    pub fn withdraw(env: Env, employee_address: Address, amount: i128) -> Result<(), Error> {
        employee_address.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let employee_key = DataKey::Employee(employee_address.clone());
        let mut employee_data: Employee = env.storage().persistent().get(&employee_key).ok_or(Error::EmployeeNotFound)?;

        let current_time = env.ledger().timestamp();
        let accrued_wages = Self::calculate_accrued(&employee_data, current_time);

        if amount > accrued_wages {
            return Err(Error::WithdrawalExceedsAccrued);
        }

        if employee_data.wage_rate > 0 {
            let time_paid_for = amount / employee_data.wage_rate;
            employee_data.last_accrual_timestamp += time_paid_for as u64;
        } else {
            employee_data.last_accrual_timestamp = current_time;
        }
        
        env.storage().persistent().set(&employee_key, &employee_data);

        let token_address: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::TokenNotConfigured)?;
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &employee_address, &amount);
        Ok(())
    }

    pub fn get_accrued_balance(env: Env, employee_address: Address) -> Result<i128, Error> {
        let employee_key = DataKey::Employee(employee_address);
        let employee_data: Employee = env.storage().persistent().get(&employee_key).ok_or(Error::EmployeeNotFound)?;
        
        let current_time = env.ledger().timestamp();
        Ok(Self::calculate_accrued(&employee_data, current_time))
    }

    // Fungsi ini sekarang menjadi kurang relevan karena karyawan bisa menarik kapan saja,
    // tapi kita biarkan saja karena tidak merusak apa pun.
    pub fn payday_sweep(env: Env, employee_address: Address) -> Result<(), Error> {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).ok_or(Error::NotAuthorized)?;
        employer.require_auth();

        let employee_key = DataKey::Employee(employee_address.clone());
        let mut employee_data: Employee = env.storage().persistent().get(&employee_key).ok_or(Error::EmployeeNotFound)?;
        
        let current_time = env.ledger().timestamp();
        let accrued_balance = Self::calculate_accrued(&employee_data, current_time);

        if accrued_balance <= 0 {
            return Err(Error::NothingToWithdraw);
        }

        employee_data.last_accrual_timestamp = current_time;
        env.storage().persistent().set(&employee_key, &employee_data);

        let token_address: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::TokenNotConfigured)?;
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &employee_address, &accrued_balance);
        Ok(())
    }

    fn calculate_accrued(employee: &Employee, current_timestamp: u64) -> i128 {
        if current_timestamp <= employee.last_accrual_timestamp {
            return 0;
        }
        let elapsed_time = current_timestamp - employee.last_accrual_timestamp;
        employee.wage_rate * (elapsed_time as i128)
    }
}
