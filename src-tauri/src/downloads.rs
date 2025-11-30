use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub filename: String,
    pub url: String,
    #[serde(rename = "totalBytes")]
    pub total_bytes: i64,
    #[serde(rename = "receivedBytes")]
    pub received_bytes: i64,
    pub state: String,
    #[serde(rename = "startTime")]
    pub start_time: i64,
    #[serde(rename = "savePath")]
    pub save_path: Option<String>,
}

fn get_downloads_file() -> Result<PathBuf, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "Could not find data directory".to_string())?
        .join("xolo-browser");
    
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    
    Ok(data_dir.join("downloads.json"))
}

pub async fn get_downloads() -> Result<Vec<Download>, String> {
    let path = get_downloads_file()?;
    
    if !path.exists() {
        return Ok(Vec::new());
    }
    
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn save_downloads(downloads: Vec<Download>) -> Result<(), String> {
    let path = get_downloads_file()?;
    let content = serde_json::to_string_pretty(&downloads).map_err(|e| e.to_string())?;
    
    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}

pub async fn clear_completed() -> Result<(), String> {
    let path = get_downloads_file()?;
    
    if path.exists() {
        tokio::fs::remove_file(path)
            .await
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
