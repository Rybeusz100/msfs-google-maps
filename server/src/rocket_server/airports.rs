use super::utils::*;
use serde::{Deserialize, Serialize};
use std::{error::Error, fs::File, io::BufReader};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Airport {
    pub wikipedia_link: String,
    pub r#type: String,
    pub scheduled_service: String,
    pub name: String,
    pub municipality: String,
    #[serde(deserialize_with = "string_as_f64")]
    pub longitude_deg: f64,
    pub local_code: String,
    #[serde(deserialize_with = "string_as_f64")]
    pub latitude_deg: f64,
    pub keywords: String,
    pub iso_region: String,
    pub iso_country: String,
    pub ident: String,
    #[serde(deserialize_with = "string_as_i32")]
    pub id: i32,
    pub iata_code: String,
    pub home_link: String,
    pub gps_code: String,
    #[serde(deserialize_with = "string_as_i32")]
    pub elevation_ft: i32,
    pub continent: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Airports(Vec<Airport>);

impl Airports {
    pub fn new() -> Airports {
        Airports(Vec::new())
    }

    pub fn from_file(file: &str) -> Result<Airports, Box<dyn Error>> {
        let file = File::open(file)?;
        let airports: Vec<Airport> = serde_json::from_reader(BufReader::new(file))?;
        Ok(Airports(airports))
    }

    pub fn find_closest(&self, latitude: f64, longitude: f64, radius_km: f64) -> Airports {
        let mut found_airports = Airports(Vec::new());
        let start_loc = geoutils::Location::new(latitude, longitude);

        let radius_km = geoutils::Distance::from_meters(radius_km * 1000f64);

        for airport in self.0.iter() {
            let end_loc = geoutils::Location::new(airport.latitude_deg, airport.longitude_deg);
            if let Ok(true) = end_loc.is_in_circle(&start_loc, radius_km) {
                found_airports.0.push(airport.clone());
            }
        }

        found_airports
    }
}
