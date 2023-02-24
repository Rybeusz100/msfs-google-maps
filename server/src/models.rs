use serde::Deserialize;

#[derive(Deserialize)]
pub enum ManagementCommand {
    Shutdown,
    ResetRoute,
}

#[derive(Deserialize)]
pub struct ManagementRequest {
    pub command: ManagementCommand,
}
