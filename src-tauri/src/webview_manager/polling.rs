//! Периодическая проверка состояния WebView

use tauri::{AppHandle, Manager, Emitter};
use super::types::WebViewUpdateEvent;

/// Периодическая проверка состояния WebView и отправка обновлений
pub async fn poll_webview_state(app: AppHandle, id: String) {
    let webview_id = format!("webview_{}", id);
    let mut last_url = String::new();
    let mut consecutive_same_count = 0;
    
    loop {
        // Проверяем существует ли ещё WebView
        if app.get_webview(&webview_id).is_none() {
            break;
        }
        
        // Получаем текущий URL
        if let Some(webview) = app.get_webview(&webview_id) {
            if let Ok(current_url) = webview.url() {
                let url_str = current_url.to_string();
                
                // Проверяем изменился ли URL
                let url_changed = url_str != last_url;
                
                if url_changed {
                    last_url = url_str.clone();
                    consecutive_same_count = 0;
                    
                    // Обновляем в менеджере
                    let state = app.state::<crate::AppState>();
                    if let Ok(mut manager) = state.webview_manager.lock() {
                        manager.update_url(&id, url_str.clone());
                    }
                    
                    // Отправляем событие об изменении URL
                    let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
                        id: id.clone(),
                        url: Some(url_str.clone()),
                        title: None,
                        is_loading: Some(true),
                        can_go_back: None,
                        can_go_forward: None,
                    });
                }
                
                // Увеличиваем счётчик если URL не менялся
                if !url_changed {
                    consecutive_same_count += 1;
                }
            }
        }
        
        // Адаптивный интервал: чаще проверяем при активной навигации
        let sleep_duration = if consecutive_same_count < 5 {
            100 // Быстрая проверка первые 500ms после изменения
        } else if consecutive_same_count < 20 {
            200 // Средняя скорость
        } else {
            500 // Медленная проверка когда страница стабильна
        };
        
        tokio::time::sleep(tokio::time::Duration::from_millis(sleep_duration)).await;
    }
}
