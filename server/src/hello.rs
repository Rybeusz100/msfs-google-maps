use colored::*;
use local_ip_address::local_ip;

pub fn hello_message() {
    let mut conf = match local_ip() {
        Ok(ip) => ip.to_string(),
        Err(_) => String::from("THIS_PC_IP"),
    };
    conf.push_str(":8054");

    let mut url = String::from("http://");
    url.push_str(conf.as_str());

    println!("{}", "SERVER IS STARTING".green().bold());
    println!("In your web browser, go to:");
    println!("On this device: {}", "http://localhost:8054".bold());
    println!(
        "On any other device within your local network: {}",
        url.bold()
    );
    println!("Press CTRL+C to shut down the program");
}
