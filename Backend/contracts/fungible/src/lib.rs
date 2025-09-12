// src/lib.rs
#![no_std]
use core::convert::TryFrom;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Vec, symbol_short,
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
    InsufficientContractBalance = 11,
    InvalidWagePeriod = 12,
    Overflow = 13,
}

const HOUR_SECONDS: u64 = 3_600;
const DAY_SECONDS: u64 = 86_400;
const WEEK_SECONDS: u64 = 604_800;
const MONTH_SECONDS: u64 = 2_592_000;

const WAGE_PERIOD_HOUR: u32 = 0;
const WAGE_PERIOD_DAY: u32 = 1;
const WAGE_PERIOD_WEEK: u32 = 2;
const WAGE_PERIOD_MONTH: u32 = 3;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Employee {
    pub wage_rate: i128,
    pub last_accrual_timestamp: u64,
    pub wage_period: u32,
    pub accrued_balance: i128,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Employer,
    Token,
    Employee(Address),
    EmployeeList,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BatchPayResult {
    pub paid_count: u32,
    pub total_amount: i128,
}

#[contract]
pub struct FairWage;

impl FairWage {
    fn i128_to_u64(v: i128) -> Result<u64, Error> {
        u64::try_from(v).map_err(|_| Error::Overflow)
    }

    fn get_period_seconds(wage_period: u32) -> u64 {
        match wage_period {
            WAGE_PERIOD_HOUR => HOUR_SECONDS,
            WAGE_PERIOD_DAY => DAY_SECONDS,
            WAGE_PERIOD_WEEK => WEEK_SECONDS,
            WAGE_PERIOD_MONTH => MONTH_SECONDS,
            _ => DAY_SECONDS,
        }
    }

    fn read_employer(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Employer)
            .ok_or(Error::NotAuthorized)
    }

    fn read_token(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::TokenNotConfigured)
    }

    fn read_employee(env: &Env, addr: &Address) -> Result<Employee, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Employee(addr.clone()))
            .ok_or(Error::EmployeeNotFound)
    }

    fn write_employee(env: &Env, addr: &Address, data: &Employee) {
        env.storage()
            .persistent()
            .set(&DataKey::Employee(addr.clone()), data);
    }

    fn require_employer_auth(env: &Env) -> Result<Address, Error> {
        let employer = Self::read_employer(env)?;
        employer.require_auth();
        Ok(employer)
    }

    fn calculate_accrued(employee: &Employee, current_timestamp: u64) -> Result<i128, Error> {
        // Employee non-aktif tidak mendapat accrued wages
        if !employee.active {
            return Ok(0);
        }
        if employee.last_accrual_timestamp == 0 || current_timestamp <= employee.last_accrual_timestamp {
            return Ok(0);
        }
        let elapsed = current_timestamp - employee.last_accrual_timestamp;
        let period = Self::get_period_seconds(employee.wage_period);
        let num = employee
            .wage_rate
            .checked_mul(i128::from(elapsed))
            .ok_or(Error::Overflow)?;
        Ok(num / i128::from(period))
    }

    fn apply_withdrawal(employee_data: &mut Employee, amount: i128, now: u64) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let current_accrual = Self::calculate_accrued(employee_data, now)?;
        let available = employee_data
            .accrued_balance
            .checked_add(current_accrual)
            .ok_or(Error::Overflow)?;
        if amount > available {
            return Err(Error::WithdrawalExceedsAccrued);
        }

        if amount <= employee_data.accrued_balance {
            employee_data.accrued_balance = employee_data
                .accrued_balance
                .checked_sub(amount)
                .ok_or(Error::Overflow)?;
            return Ok(());
        }

        let from_current = amount
            .checked_sub(employee_data.accrued_balance)
            .ok_or(Error::Overflow)?;
        employee_data.accrued_balance = 0;

        let period_seconds = Self::get_period_seconds(employee_data.wage_period);
        let sec_num = i128::from(period_seconds)
            .checked_mul(from_current)
            .ok_or(Error::Overflow)?;
        let seconds_paid_i128 = sec_num
            .checked_div(employee_data.wage_rate)
            .ok_or(Error::Overflow)?;
        let seconds_paid = Self::i128_to_u64(seconds_paid_i128)?;

        employee_data.last_accrual_timestamp = employee_data
            .last_accrual_timestamp
            .checked_add(seconds_paid)
            .ok_or(Error::Overflow)?;
        Ok(())
    }
}

#[contractimpl]
impl FairWage {
    pub fn initialize(env: Env, employer: Address, token_address: Address) -> Result<(), Error> {
        employer.require_auth();
        if env.storage().instance().has(&DataKey::Employer) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Employer, &employer);
        env.storage().instance().set(&DataKey::Token, &token_address);
        env.storage().persistent().set(&DataKey::EmployeeList, &Vec::<Address>::new(&env));
        Ok(())
    }

    pub fn add_employee(
        env: Env,
        employee_address: Address,
        wage_rate: i128,
        wage_period: u32,
    ) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        if wage_rate <= 0 {
            return Err(Error::InvalidWageRate);
        }
        if wage_period > WAGE_PERIOD_MONTH {
            return Err(Error::InvalidWagePeriod);
        }
        let key = DataKey::Employee(employee_address.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::EmployeeAlreadyExists);
        }
        let data = Employee {
            wage_rate,
            last_accrual_timestamp: env.ledger().timestamp(),
            wage_period,
            accrued_balance: 0,
            active: true,
        };
        env.storage().persistent().set(&key, &data);

        let mut list: Vec<Address> = env.storage().persistent().get(&DataKey::EmployeeList).unwrap_or(Vec::new(&env));
        list.push_back(employee_address.clone());
        env.storage().persistent().set(&DataKey::EmployeeList, &list);

        env.events().publish((symbol_short!("hire"), &employee_address), data.wage_rate);
        Ok(())
    }

    pub fn update_wage_rate(env: Env, employee_address: Address, new_wage_rate: i128) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        if new_wage_rate <= 0 { return Err(Error::InvalidWageRate); }

        let key = DataKey::Employee(employee_address.clone());
        let mut data: Employee = env.storage().persistent().get(&key).ok_or(Error::EmployeeNotFound)?;
        let now = env.ledger().timestamp();
        let accrued = Self::calculate_accrued(&data, now)?;
        data.accrued_balance = data.accrued_balance.checked_add(accrued).ok_or(Error::Overflow)?;
        data.wage_rate = new_wage_rate;
        data.last_accrual_timestamp = now;
        env.storage().persistent().set(&key, &data);
        env.events().publish((symbol_short!("wage_set"), &employee_address), new_wage_rate);
        Ok(())
    }

    pub fn freeze_employee(env: Env, employee_address: Address) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        let key = DataKey::Employee(employee_address.clone());
        let mut data: Employee = env.storage().persistent().get(&key).ok_or(Error::EmployeeNotFound)?;
        
        // Hitung dan bayar semua accrued wages
        let now = env.ledger().timestamp();
        let accrued = Self::calculate_accrued(&data, now)?;
        let total_owed = data.accrued_balance.checked_add(accrued).ok_or(Error::Overflow)?;
        
        if total_owed > 0 {
            // Bayar semua accrued wages
            let token_addr = Self::read_token(&env)?;
            let token_client = token::Client::new(&env, &token_addr);
            let contract_balance = token_client.balance(&env.current_contract_address());
            if total_owed > contract_balance { return Err(Error::InsufficientContractBalance); }
            
            // Reset accrued balance dan update timestamp
            data.accrued_balance = 0;
            data.last_accrual_timestamp = now;
            
            // Transfer ke karyawan
            token_client.transfer(&env.current_contract_address(), &employee_address, &total_owed);
            env.events().publish((symbol_short!("final_pay"), &employee_address), total_owed);
        }
        
        // Set employee sebagai non-aktif
        data.active = false;
        env.storage().persistent().set(&key, &data);
        
        env.events().publish((symbol_short!("freeze"), &employee_address), ());
        Ok(())
    }

    pub fn activate_employee(env: Env, employee_address: Address) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        let key = DataKey::Employee(employee_address.clone());
        let mut data: Employee = env.storage().persistent().get(&key).ok_or(Error::EmployeeNotFound)?;
        
        // Set employee sebagai aktif
        data.active = true;
        env.storage().persistent().set(&key, &data);
        
        env.events().publish((symbol_short!("activate"), &employee_address), ());
        Ok(())
    }

    pub fn remove_employee(env: Env, employee_address: Address) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        let key = DataKey::Employee(employee_address.clone());
        let data: Employee = env.storage().persistent().get(&key).ok_or(Error::EmployeeNotFound)?;
        
        // Hanya bisa remove employee yang sudah di-freeze (non-aktif)
        if data.active { return Err(Error::CannotRemoveActiveEmployee); }
        
        env.storage().persistent().remove(&key);

        if let Some(list) = env.storage().persistent().get::<_, Vec<Address>>(&DataKey::EmployeeList) {
            let mut new_list = Vec::new(&env);
            for addr in list.iter() {
                if addr != employee_address {
                    new_list.push_back(addr.clone());
                }
            }
            env.storage().persistent().set(&DataKey::EmployeeList, &new_list);
        }

        env.events().publish((symbol_short!("fire"), &employee_address), ());
        Ok(())
    }

    pub fn list_employees(env: Env) -> Vec<Address> {
        env.storage().persistent().get(&DataKey::EmployeeList).unwrap_or(Vec::new(&env))
    }

    pub fn get_live_accrued_balance(env: Env, employee_address: Address) -> Result<i128, Error> {
        let data = Self::read_employee(&env, &employee_address)?;
        let now = env.ledger().timestamp();
        let accrued = Self::calculate_accrued(&data, now)?;
        data.accrued_balance.checked_add(accrued).ok_or(Error::Overflow)
    }

    pub fn deposit(env: Env, amount: i128) -> Result<(), Error> {
        let employer = Self::require_employer_auth(&env)?;
        if amount <= 0 { return Err(Error::InvalidAmount); }
        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&employer, &env.current_contract_address(), &amount);
        env.events().publish((symbol_short!("deposit"), &employer), amount);
        Ok(())
    }

    pub fn withdraw_surplus(env: Env, amount: i128) -> Result<(), Error> {
        let employer = Self::require_employer_auth(&env)?;
        if amount <= 0 { return Err(Error::InvalidAmount); }
        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        let contract_balance = token_client.balance(&env.current_contract_address());
        if amount > contract_balance { return Err(Error::InsufficientContractBalance); }
        token_client.transfer(&env.current_contract_address(), &employer, &amount);
        env.events().publish((symbol_short!("surplus"), &employer), amount);
        Ok(())
    }

    pub fn withdraw(env: Env, employee_address: Address, amount: i128) -> Result<(), Error> {
        employee_address.require_auth();
        if amount <= 0 { return Err(Error::InvalidAmount); }
        let key = DataKey::Employee(employee_address.clone());
        let mut data: Employee = env.storage().persistent().get(&key).ok_or(Error::EmployeeNotFound)?;
        let now = env.ledger().timestamp();
        Self::apply_withdrawal(&mut data, amount, now)?;
        Self::write_employee(&env, &employee_address, &data);
        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &employee_address, &amount);
        env.events().publish((symbol_short!("withdraw"), &employee_address), amount);
        Ok(())
    }

    pub fn pay_partial_by_employer(env: Env, employee_address: Address, amount: i128) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        if amount <= 0 { return Err(Error::InvalidAmount); }
        let key = DataKey::Employee(employee_address.clone());
        let mut data: Employee = env.storage().persistent().get(&key).ok_or(Error::EmployeeNotFound)?;
        let now = env.ledger().timestamp();
        Self::apply_withdrawal(&mut data, amount, now)?;
        Self::write_employee(&env, &employee_address, &data);
        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        let contract_balance = token_client.balance(&env.current_contract_address());
        if amount > contract_balance { return Err(Error::InsufficientContractBalance); }
        token_client.transfer(&env.current_contract_address(), &employee_address, &amount);
        env.events().publish((symbol_short!("pay_part"), &employee_address), amount);
        Ok(())
    }

    pub fn payday_sweep(env: Env, employee_address: Address) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        let mut data = Self::read_employee(&env, &employee_address)?;

        let now = env.ledger().timestamp();
        let accrued = Self::calculate_accrued(&data, now)?;
        let total_owed = data.accrued_balance.checked_add(accrued).ok_or(Error::Overflow)?;
        if total_owed <= 0 { return Err(Error::NothingToWithdraw); }

        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        let contract_balance = token_client.balance(&env.current_contract_address());
        if total_owed > contract_balance { return Err(Error::InsufficientContractBalance); }

        data.accrued_balance = 0;
        data.last_accrual_timestamp = now;
        Self::write_employee(&env, &employee_address, &data);

        token_client.transfer(&env.current_contract_address(), &employee_address, &total_owed);
        env.events().publish((symbol_short!("sweep"), &employee_address), total_owed);
        Ok(())
    }

    pub fn payday_sweep_many(env: Env, employees: Vec<Address>) -> Result<BatchPayResult, Error> {
        let _employer = Self::require_employer_auth(&env)?;
        let now = env.ledger().timestamp();

        let mut total: i128 = 0;
        let mut count: u32 = 0;
        for i in 0..employees.len() {
            let addr = employees.get(i).unwrap();
            if let Ok(emp) = Self::read_employee(&env, &addr) {
                let owed = emp
                    .accrued_balance
                    .checked_add(Self::calculate_accrued(&emp, now)?)
                    .ok_or(Error::Overflow)?;
                if owed > 0 {
                    total = total.checked_add(owed).ok_or(Error::Overflow)?;
                    count = count.checked_add(1).ok_or(Error::Overflow)?;
                }
            }
        }
        if total <= 0 {
            return Err(Error::NothingToWithdraw);
        }

        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        let contract_balance = token_client.balance(&env.current_contract_address());
        if total > contract_balance {
            return Err(Error::InsufficientContractBalance);
        }

        for i in 0..employees.len() {
            let addr = employees.get(i).unwrap();
            let mut emp = match Self::read_employee(&env, &addr) { Ok(v) => v, Err(_) => continue };
            let owed = emp
                .accrued_balance
                .checked_add(Self::calculate_accrued(&emp, now)?)
                .ok_or(Error::Overflow)?;
            if owed <= 0 { continue; }

            emp.accrued_balance = 0;
            emp.last_accrual_timestamp = now;
            Self::write_employee(&env, &addr, &emp);
            token_client.transfer(&env.current_contract_address(), &addr, &owed);
            env.events().publish((symbol_short!("sweep"), &addr), owed);
        }

        Ok(BatchPayResult { paid_count: count, total_amount: total })
    }

    pub fn get_accrued_balance(env: Env, employee_address: Address) -> Result<i128, Error> {
        let data = Self::read_employee(&env, &employee_address)?;
        let now = env.ledger().timestamp();
        let current = Self::calculate_accrued(&data, now)?;
        data.accrued_balance.checked_add(current).ok_or(Error::Overflow)
    }

    pub fn get_employee_info(env: Env, employee_address: Address) -> Result<Employee, Error> {
        Self::read_employee(&env, &employee_address)
    }

    pub fn get_contract_balance(env: Env) -> Result<i128, Error> {
        let token_addr = Self::read_token(&env)?;
        let token_client = token::Client::new(&env, &token_addr);
        Ok(token_client.balance(&env.current_contract_address()))
    }

    pub fn fix_employee_timestamp(env: Env, employee_address: Address) -> Result<(), Error> {
        let _employer = Self::require_employer_auth(&env)?;
        let mut data = Self::read_employee(&env, &employee_address)?;
        if data.last_accrual_timestamp == 0 {
            data.last_accrual_timestamp = env.ledger().timestamp();
            Self::write_employee(&env, &employee_address, &data);
        }
        Ok(())
    }
}