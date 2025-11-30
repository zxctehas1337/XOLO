use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<i64>,
    pub token_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
    pub verified_email: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthResult {
    pub success: bool,
    #[serde(rename = "userInfo")]
    pub user_info: Option<GoogleUser>,
    pub tokens: Option<OAuthTokens>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthRefreshResult {
    pub success: bool,
    pub tokens: Option<OAuthTokens>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoutResult {
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserData {
    #[serde(rename = "userInfo")]
    pub user_info: GoogleUser,
    pub tokens: OAuthTokens,
}

// Хранилище для OAuth данных
lazy_static::lazy_static! {
    static ref OAUTH_STORAGE: Arc<Mutex<OAuthStorage>> = Arc::new(Mutex::new(OAuthStorage::new()));
}

struct OAuthStorage {
    tokens: Option<OAuthTokens>,
    user_info: Option<GoogleUser>,
}

impl OAuthStorage {
    fn new() -> Self {
        Self {
            tokens: None,
            user_info: None,
        }
    }
}

pub async fn google_oauth_login(client_id: String, client_secret: String) -> Result<OAuthResult, String> {
    // Запускаем локальный сервер для OAuth callback
    let (tx, rx) = tokio::sync::oneshot::channel();
    
    tokio::spawn(async move {
        let result = run_oauth_flow(client_id, client_secret).await;
        let _ = tx.send(result);
    });
    
    match rx.await {
        Ok(result) => result,
        Err(_) => Ok(OAuthResult {
            success: false,
            user_info: None,
            tokens: None,
            error: Some("OAuth flow failed".to_string()),
        }),
    }
}

async fn run_oauth_flow(client_id: String, client_secret: String) -> Result<OAuthResult, String> {
    use tiny_http::{Server, Response};
    
    let server = Server::http("127.0.0.1:8888").map_err(|e| e.to_string())?;
    
    // Формируем URL для авторизации
    let redirect_uri = "http://localhost:8888/callback";
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        client_id,
        urlencoding::encode(redirect_uri),
        urlencoding::encode("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email")
    );
    
    // Открываем браузер (используем системную команду напрямую)
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd").args(["/c", "start", &auth_url]).spawn();
    
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(&auth_url).spawn();
    
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(&auth_url).spawn();
    
    // Ждем callback
    for request in server.incoming_requests() {
        let url = request.url().to_string();
        
        if url.starts_with("/callback") {
            // Парсим query параметры
            if let Some(query) = url.split('?').nth(1) {
                let params: std::collections::HashMap<String, String> = query
                    .split('&')
                    .filter_map(|pair| {
                        let mut parts = pair.split('=');
                        Some((parts.next()?.to_string(), parts.next()?.to_string()))
                    })
                    .collect();
                
                if let Some(error) = params.get("error") {
                    let response = Response::from_string(format!(
                        r#"<html><body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h2>❌ Ошибка авторизации</h2>
                        <p>{}</p>
                        <p>Вы можете закрыть это окно.</p>
                        </body></html>"#,
                        error
                    ));
                    let _ = request.respond(response);
                    
                    return Ok(OAuthResult {
                        success: false,
                        user_info: None,
                        tokens: None,
                        error: Some(error.clone()),
                    });
                }
                
                if let Some(code) = params.get("code") {
                    // Обмениваем код на токен
                    match exchange_code_for_token(&client_id, &client_secret, code, redirect_uri).await {
                        Ok(tokens) => {
                            // Получаем информацию о пользователе
                            match fetch_user_info(&tokens.access_token).await {
                                Ok(user_info) => {
                                    // Сохраняем в хранилище
                                    let mut storage = OAUTH_STORAGE.lock().await;
                                    storage.tokens = Some(tokens.clone());
                                    storage.user_info = Some(user_info.clone());
                                    
                                    let response = Response::from_string(
                                        r#"<html><body style="font-family: Arial; text-align: center; padding: 50px;">
                                        <h2>✅ Авторизация успешна!</h2>
                                        <p>Вы можете закрыть это окно и вернуться в приложение.</p>
                                        <script>window.close();</script>
                                        </body></html>"#
                                    );
                                    let _ = request.respond(response);
                                    
                                    return Ok(OAuthResult {
                                        success: true,
                                        user_info: Some(user_info),
                                        tokens: Some(tokens),
                                        error: None,
                                    });
                                },
                                Err(e) => {
                                    let response = Response::from_string(format!(
                                        r#"<html><body style="font-family: Arial; text-align: center; padding: 50px;">
                                        <h2>❌ Ошибка получения данных пользователя</h2>
                                        <p>{}</p>
                                        <p>Вы можете закрыть это окно.</p>
                                        </body></html>"#,
                                        e
                                    ));
                                    let _ = request.respond(response);
                                    
                                    return Ok(OAuthResult {
                                        success: false,
                                        user_info: None,
                                        tokens: None,
                                        error: Some(e),
                                    });
                                }
                            }
                        },
                        Err(e) => {
                            let response = Response::from_string(format!(
                                r#"<html><body style="font-family: Arial; text-align: center; padding: 50px;">
                                <h2>❌ Ошибка получения токена</h2>
                                <p>{}</p>
                                <p>Вы можете закрыть это окно.</p>
                                </body></html>"#,
                                e
                            ));
                            let _ = request.respond(response);
                            
                            return Ok(OAuthResult {
                                success: false,
                                user_info: None,
                                tokens: None,
                                error: Some(e),
                            });
                        }
                    }
                }
            }
        }
    }
    
    Ok(OAuthResult {
        success: false,
        user_info: None,
        tokens: None,
        error: Some("OAuth timeout".to_string()),
    })
}

async fn exchange_code_for_token(
    client_id: &str,
    client_secret: &str,
    code: &str,
    redirect_uri: &str,
) -> Result<OAuthTokens, String> {
    let client = reqwest::Client::new();
    
    let params = [
        ("client_id", client_id),
        ("client_secret", client_secret),
        ("code", code),
        ("grant_type", "authorization_code"),
        ("redirect_uri", redirect_uri),
    ];
    
    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        let error = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Token exchange failed: {}", error));
    }
    
    response.json().await.map_err(|e| e.to_string())
}

async fn fetch_user_info(access_token: &str) -> Result<GoogleUser, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err("Failed to fetch user info".to_string());
    }
    
    response.json().await.map_err(|e| e.to_string())
}

pub async fn google_oauth_refresh() -> Result<OAuthRefreshResult, String> {
    let storage = OAUTH_STORAGE.lock().await;
    
    let _refresh_token = storage
        .tokens
        .as_ref()
        .and_then(|t| t.refresh_token.as_ref())
        .ok_or_else(|| "No refresh token available".to_string())?;
    
    // TODO: Получить client_id и client_secret из настроек
    // Пока возвращаем ошибку
    Ok(OAuthRefreshResult {
        success: false,
        tokens: None,
        error: Some("Refresh not implemented yet".to_string()),
    })
}

pub async fn google_oauth_logout() -> Result<LogoutResult, String> {
    let mut storage = OAUTH_STORAGE.lock().await;
    storage.tokens = None;
    storage.user_info = None;
    
    Ok(LogoutResult { success: true })
}

pub async fn google_oauth_get_user() -> Result<Option<UserData>, String> {
    let storage = OAUTH_STORAGE.lock().await;
    
    if let (Some(user_info), Some(tokens)) = (&storage.user_info, &storage.tokens) {
        Ok(Some(UserData {
            user_info: user_info.clone(),
            tokens: tokens.clone(),
        }))
    } else {
        Ok(None)
    }
}
