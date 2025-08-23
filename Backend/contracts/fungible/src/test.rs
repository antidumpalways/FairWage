// Di dalam file: contracts/fungible/src/test.rs

use crate::{FairWage, FairWageClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo, AuthorizedFunction, AuthorizedInvocation, MockAuth},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, IntoVal, Symbol, Vec,
};

// Fungsi helper untuk membuat token
fn register_token_contract<'a>(env: &'a Env, admin: &Address) -> (Address, TokenClient<'a>) {
    let token_id = env.register_stellar_asset_contract(admin.clone());
    (token_id, TokenClient::new(env, &token_id))
}

#[test]
fn test_fair_wage_full_scenario() {
    let env = Env::default();
    let contract_id = env.register_contract(None, FairWage);
    let client = FairWageClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let (token_id, token_client) = register_token_contract(&env, &employer);

    // --- 1. Inisialisasi dan Tambah Karyawan ---
    env.mock_all_auths();
    client.initialize(&employer, &token_id);
    client.add_employee(&employee, &100);
    env.clear_all_auths();

    // --- 2. Mint Token ke Majikan ---
    env.as_contract(&token_id, || {
        StellarAssetClient::new(&env, &token_id).mint(&employer, &10_000);
    });
    assert_eq!(token_client.balance(&employer), 10_000);

    // --- 3. Majikan Melakukan Deposit ---
    let deposit_amount = 5_000_i128;
    // Otorisasi untuk panggilan `transfer` yang terjadi di dalam `deposit`
    let transfer_auth = AuthorizedInvocation {
        function: AuthorizedFunction::Contract(
            token_id.clone(),
            Symbol::new(&env, "transfer"),
            (&employer, &contract_id, &deposit_amount).into_val(&env),
        ),
        sub_invokes: Vec::new(&env),
    };
    // Otorisasi untuk panggilan `deposit` itu sendiri
    let deposit_auth = AuthorizedInvocation {
        function: AuthorizedFunction::Contract(
            contract_id.clone(),
            Symbol::new(&env, "deposit"),
            (deposit_amount,).into_val(&env),
        ),
        sub_invokes: Vec::from_array(&env, &[transfer_auth]),
    };
    // Buat mock auth dan panggil
    let mut auth = MockAuth::new(&env, &employer, vec![deposit_auth]);
    auth.invoke_contract(&contract_id, &client.address, &Symbol::new(&env, "deposit"), (deposit_amount,).into_val(&env));
    
    assert_eq!(token_client.balance(&contract_id), 5_000);
    assert_eq!(token_client.balance(&employer), 5_000);

    // --- 4. Majukan Waktu dan Cek Saldo Akrual ---
    env.ledger().set(LedgerInfo {
        timestamp: env.ledger().get().timestamp + 10,
        ..env.ledger().get()
    });
    assert_eq!(client.get_accrued_balance(&employee), 1000);

    // --- 5. Karyawan Menarik Gaji ---
    let withdraw_amount = 700_i128;
    // Otorisasi untuk panggilan `transfer` yang terjadi di dalam `withdraw`
    let withdraw_transfer_auth = AuthorizedInvocation {
        function: AuthorizedFunction::Contract(
            token_id.clone(),
            Symbol::new(&env, "transfer"),
            (&contract_id, &employee, &withdraw_amount).into_val(&env),
        ),
        sub_invokes: Vec::new(&env),
    };
    // Otorisasi untuk panggilan `withdraw` itu sendiri
    let withdraw_auth = AuthorizedInvocation {
        function: AuthorizedFunction::Contract(
            contract_id.clone(),
            Symbol::new(&env, "withdraw"),
            (&employee, withdraw_amount).into_val(&env),
        ),
        sub_invokes: Vec::from_array(&env, &[withdraw_transfer_auth]),
    };
    // Buat mock auth dan panggil
    let mut auth_withdraw = MockAuth::new(&env, &employee, vec![withdraw_auth]);
    auth_withdraw.invoke_contract(&contract_id, &client.address, &Symbol::new(&env, "withdraw"), (&employee, withdraw_amount).into_val(&env));

    assert_eq!(token_client.balance(&employee), 700);
    assert_eq!(token_client.balance(&contract_id), 4_300);
}
