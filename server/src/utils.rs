use serde::{Deserialize, Deserializer};

pub fn string_as_f64<'de, D>(deserializer: D) -> Result<f64, D::Error>
where
    D: Deserializer<'de>,
{
    let val_string: String = Deserialize::deserialize(deserializer)?;
    if let Ok(val_f64) = val_string.parse::<f64>() {
        Ok(val_f64)
    } else {
        Ok(0f64)
    }
}

pub fn string_as_i32<'de, D>(deserializer: D) -> Result<i32, D::Error>
where
    D: Deserializer<'de>,
{
    let val_string: String = Deserialize::deserialize(deserializer)?;
    if let Ok(val_i32) = val_string.parse::<i32>() {
        Ok(val_i32)
    } else {
        Ok(0i32)
    }
}
