use server::{rocket_server, sim_connection};

#[rocket::main]
async fn main() {
    #[cfg(debug_assertions)]
    std::env::set_var("RUST_LOG", "trace");

    #[cfg(not(debug_assertions))]
    std::env::set_var("RUST_LOG", "warn");

    env_logger::init();

    #[cfg(not(debug_assertions))]
    server::hello::hello_message();

    let (handle, worker_conn) = sim_connection::start();

    rocket_server::start(worker_conn).await;

    handle.join().unwrap();
}
