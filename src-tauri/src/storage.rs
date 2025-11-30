use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    #[serde(rename = "visitedAt")]
    pub visited_at: i64,
}

fn get_data_dir() -> Result<PathBuf, String> {
    dirs::data_dir()
        .ok_or_else(|| "Could not find data directory".to_string())
        .map(|p| p.join("xolo-browser"))
}

fn ensure_data_dir() -> Result<PathBuf, String> {
    let dir = get_data_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

pub async fn get_settings() -> Result<serde_json::Value, String> {
    let path = ensure_data_dir()?.join("settings.json");
    
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn set_settings(settings: serde_json::Value) -> Result<(), String> {
    let path = ensure_data_dir()?.join("settings.json");
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    
    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}

pub async fn get_bookmarks() -> Result<Vec<Bookmark>, String> {
    let path = ensure_data_dir()?.join("bookmarks.json");
    
    if !path.exists() {
        return Ok(Vec::new());
    }
    
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn set_bookmarks(bookmarks: Vec<Bookmark>) -> Result<(), String> {
    let path = ensure_data_dir()?.join("bookmarks.json");
    let content = serde_json::to_string_pretty(&bookmarks).map_err(|e| e.to_string())?;
    
    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}

pub async fn get_history() -> Result<Vec<HistoryEntry>, String> {
    let path = ensure_data_dir()?.join("history.json");
    
    if !path.exists() {
        return Ok(Vec::new());
    }
    
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub async fn add_history(entry: HistoryEntry) -> Result<(), String> {
    let mut history = get_history().await?;
    history.insert(0, entry);
    
    // Ограничиваем до 5000 записей
    if history.len() > 5000 {
        history.truncate(5000);
    }
    
    let path = ensure_data_dir()?.join("history.json");
    let content = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;
    
    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())
}

pub async fn clear_history() -> Result<(), String> {
    let path = ensure_data_dir()?.join("history.json");
    
    if path.exists() {
        tokio::fs::remove_file(path)
            .await
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

pub async fn save_session(session_data: serde_json::Value) -> Result<bool, String> {
    let path = ensure_data_dir()?.join("session.json");
    let content = serde_json::to_string_pretty(&session_data).map_err(|e| e.to_string())?;
    
    tokio::fs::write(path, content)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(true)
}

pub async fn restore_session() -> Result<Option<serde_json::Value>, String> {
    let path = ensure_data_dir()?.join("session.json");
    
    if !path.exists() {
        return Ok(None);
    }
    
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;
    
    let session: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    Ok(Some(session))
}

pub async fn clear_session() -> Result<bool, String> {
    let path = ensure_data_dir()?.join("session.json");
    
    if path.exists() {
        tokio::fs::remove_file(path)
            .await
            .map_err(|e| e.to_string())?;
    }
    
    Ok(true)
}

#[derive(Serialize)]
pub struct ImportResult {
    pub bookmarks: Vec<Bookmark>,
    pub history: Vec<HistoryEntry>,
}

pub async fn import_from_browser(browser: &str) -> Result<Option<ImportResult>, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    
    let bookmarks_path = match browser {
        "chrome" => {
            #[cfg(target_os = "windows")]
            { home_dir.join("AppData/Local/Google/Chrome/User Data/Default/Bookmarks") }
            
            #[cfg(target_os = "macos")]
            { home_dir.join("Library/Application Support/Google/Chrome/Default/Bookmarks") }
            
            #[cfg(target_os = "linux")]
            { home_dir.join(".config/google-chrome/Default/Bookmarks") }
        },
        "edge" => {
            #[cfg(target_os = "windows")]
            { home_dir.join("AppData/Local/Microsoft/Edge/User Data/Default/Bookmarks") }
            
            #[cfg(target_os = "macos")]
            { home_dir.join("Library/Application Support/Microsoft Edge/Default/Bookmarks") }
            
            #[cfg(target_os = "linux")]
            { home_dir.join(".config/microsoft-edge/Default/Bookmarks") }
        },
        _ => return Ok(None),
    };
    
    if !bookmarks_path.exists() {
        return Ok(None);
    }
    
    let content = tokio::fs::read_to_string(bookmarks_path)
        .await
        .map_err(|e| e.to_string())?;
    
    let data: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    let mut bookmarks = Vec::new();
    
    fn extract_bookmarks(node: &serde_json::Value, bookmarks: &mut Vec<Bookmark>) {
        if let Some(node_type) = node.get("type").and_then(|v| v.as_str()) {
            if node_type == "url" {
                if let (Some(url), Some(name)) = (
                    node.get("url").and_then(|v| v.as_str()),
                    node.get("name").and_then(|v| v.as_str()),
                ) {
                    bookmarks.push(Bookmark {
                        id: format!("{}{}", chrono::Utc::now().timestamp_millis(), rand::random::<u32>()),
                        url: url.to_string(),
                        title: name.to_string(),
                        favicon: None,
                        created_at: chrono::Utc::now().timestamp_millis(),
                    });
                }
            }
        }
        
        if let Some(children) = node.get("children").and_then(|v| v.as_array()) {
            for child in children {
                extract_bookmarks(child, bookmarks);
            }
        }
    }
    
    if let Some(roots) = data.get("roots").and_then(|v| v.as_object()) {
        for (_, root) in roots {
            extract_bookmarks(root, &mut bookmarks);
        }
    }
    
    Ok(Some(ImportResult {
        bookmarks,
        history: Vec::new(),
    }))
}
