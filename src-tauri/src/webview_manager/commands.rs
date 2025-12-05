//! Tauri команды для управления WebView

use tauri::{AppHandle, Manager, WebviewUrl, WebviewBuilder, LogicalPosition, LogicalSize, Emitter};
use super::types::{WebViewUpdateEvent, WebViewInfo, WebViewBounds};
use super::polling::poll_webview_state;
use super::CHROME_USER_AGENT;

/// Создание нового нативного WebView для вкладки (встроенного в главное окно)
#[tauri::command]
pub async fn create_webview(
    app: AppHandle,
    id: String,
    url: String,
    bounds: WebViewBounds,
) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    
    // Добавляем в менеджер
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.add(id.clone(), url.clone());
    }
    
    // Сохраняем bounds сразу при создании
    {
        let mut bounds_map = state.webview_bounds.lock().map_err(|e| e.to_string())?;
        bounds_map.insert(id.clone(), bounds.clone());
    }

    // Создаём URL для WebView
    let webview_url = if url.is_empty() || url == "about:blank" {
        WebviewUrl::App("about:blank".into())
    } else {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    };

    // Получаем главное окно
    let main_window = app.get_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    let webview_id = format!("webview_{}", id);
    let tab_id = id.clone();
    let app_handle = app.clone();
    
    // Создаём WebView с оптимизированными настройками
    let builder = WebviewBuilder::new(&webview_id, webview_url)
        // Устанавливаем User-Agent для совместимости с Google
        .user_agent(CHROME_USER_AGENT)
        // Включаем аппаратное ускорение и оптимизации
        .auto_resize()
        // Разрешаем clipboard для копирования/вставки
        .enable_clipboard_access()
        // Обработчик навигации - отслеживаем изменения URL
        .on_navigation(move |nav_url| {
            let url_str = nav_url.to_string();
            let _ = app_handle.emit("webview-url-changed", WebViewUpdateEvent {
                id: tab_id.clone(),
                url: Some(url_str),
                title: None,
                is_loading: Some(true),
                can_go_back: None,
                can_go_forward: None,
            });
            true // Разрешаем навигацию
        });
    
    main_window.add_child(
        builder,
        LogicalPosition::new(bounds.x, bounds.y),
        LogicalSize::new(bounds.width, bounds.height),
    ).map_err(|e| format!("Failed to add webview to window: {}", e))?;

    // Запускаем периодическую проверку состояния WebView
    let app_for_polling = app.clone();
    let id_for_polling = id.clone();
    tauri::async_runtime::spawn(async move {
        // Даём время на загрузку
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        poll_webview_state(app_for_polling, id_for_polling).await;
    });

    Ok(())
}

/// Закрытие WebView
#[tauri::command]
pub async fn close_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    
    // Удаляем из менеджера
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.remove(&id);
    }

    // Закрываем WebView (получаем его из главного окна)
    let webview_id = format!("webview_{}", id);
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.close().map_err(|e| format!("Failed to close webview: {}", e))?;
    }

    Ok(())
}

/// Навигация в WebView
#[tauri::command]
pub async fn navigate_webview(
    app: AppHandle,
    id: String,
    url: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        let parsed_url: tauri::Url = url.parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview.navigate(parsed_url)
            .map_err(|e| format!("Navigation failed: {}", e))?;
        
        // Обновляем URL в менеджере
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.webview_manager.lock() {
            manager.update_url(&id, url);
        };
    }

    Ok(())
}

/// Назад
#[tauri::command]
pub async fn go_back(
    app: AppHandle,
    id: String,
) -> Result<bool, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        // Выполняем JavaScript для навигации назад
        webview.eval("window.history.back()")
            .map_err(|e| format!("Failed to go back: {}", e))?;
        return Ok(true);
    }
    
    Ok(false)
}

/// Вперёд
#[tauri::command]
pub async fn go_forward(
    app: AppHandle,
    id: String,
) -> Result<bool, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.history.forward()")
            .map_err(|e| format!("Failed to go forward: {}", e))?;
        return Ok(true);
    }
    
    Ok(false)
}

/// Перезагрузка
#[tauri::command]
pub async fn reload_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.location.reload()")
            .map_err(|e| format!("Failed to reload: {}", e))?;
    }

    Ok(())
}

/// Остановка загрузки
#[tauri::command]
pub async fn stop_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.stop()")
            .map_err(|e| format!("Failed to stop: {}", e))?;
    }

    Ok(())
}

/// Получение информации о WebView
#[tauri::command]
pub async fn get_webview_info(
    app: AppHandle,
    id: String,
) -> Result<Option<WebViewInfo>, String> {
    let state = app.state::<crate::AppState>();
    let manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
    Ok(manager.get(&id).cloned())
}

/// Выполнение JavaScript
#[tauri::command]
pub async fn execute_script(
    app: AppHandle,
    id: String,
    script: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval(&script)
            .map_err(|e| format!("Script execution failed: {}", e))?;
    }

    Ok(())
}

/// Установка масштаба
#[tauri::command]
pub async fn set_zoom(
    app: AppHandle,
    id: String,
    zoom: f64,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.set_zoom(zoom)
            .map_err(|e| format!("Failed to set zoom: {}", e))?;
    }

    Ok(())
}

/// Обновление позиции и размера WebView
#[tauri::command]
pub async fn update_webview_bounds(
    app: AppHandle,
    id: String,
    bounds: WebViewBounds,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    // Сохраняем bounds для восстановления при показе
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut bounds_map) = state.webview_bounds.lock() {
            bounds_map.insert(id.clone(), bounds.clone());
        };
    }
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.set_position(LogicalPosition::new(bounds.x, bounds.y))
            .map_err(|e| format!("Failed to set position: {}", e))?;
        webview.set_size(LogicalSize::new(bounds.width, bounds.height))
            .map_err(|e| format!("Failed to set size: {}", e))?;
    }

    Ok(())
}

/// Показать/скрыть WebView
#[tauri::command]
pub async fn set_webview_visible(
    app: AppHandle,
    id: String,
    visible: bool,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        let state = app.state::<crate::AppState>();
        
        if visible {
            // Показываем: восстанавливаем позицию и размер из сохранённых bounds
            let bounds_opt = {
                let bounds_map = state.webview_bounds.lock().map_err(|e| e.to_string())?;
                bounds_map.get(&id).cloned()
            };
            
            if let Some(bounds) = bounds_opt {
                // Проверяем что bounds валидные (не скрытые)
                if bounds.x >= 0.0 && bounds.y >= 0.0 && bounds.width > 10.0 && bounds.height > 10.0 {
                    webview.set_position(LogicalPosition::new(bounds.x, bounds.y))
                        .map_err(|e| format!("Failed to set position: {}", e))?;
                    webview.set_size(LogicalSize::new(bounds.width, bounds.height))
                        .map_err(|e| format!("Failed to set size: {}", e))?;
                } else {
                    // Bounds невалидные - логируем предупреждение
                    eprintln!("Warning: Invalid bounds for webview {}: {:?}", id, bounds);
                }
            } else {
                // Bounds не сохранены - логируем предупреждение
                eprintln!("Warning: No saved bounds for webview {}", id);
            }
        } else {
            // Скрываем: перемещаем за пределы экрана и делаем размер минимальным
            webview.set_position(LogicalPosition::new(-10000.0, -10000.0))
                .map_err(|e| format!("Failed to hide webview: {}", e))?;
            webview.set_size(LogicalSize::new(1.0, 1.0))
                .map_err(|e| format!("Failed to resize webview: {}", e))?;
        }
    }

    Ok(())
}

/// Получить URL текущей страницы
#[tauri::command]
pub async fn get_webview_url(
    app: AppHandle,
    id: String,
) -> Result<String, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        return webview.url()
            .map(|u| u.to_string())
            .map_err(|e| format!("Failed to get URL: {}", e));
    }

    Err("WebView not found".to_string())
}

/// Проверить существует ли WebView
#[tauri::command]
pub async fn webview_exists(
    app: AppHandle,
    id: String,
) -> Result<bool, String> {
    let webview_id = format!("webview_{}", id);
    Ok(app.get_webview(&webview_id).is_some())
}

/// Получить title страницы из WebView
#[tauri::command]
pub async fn get_webview_title(
    app: AppHandle,
    id: String,
) -> Result<String, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(_webview) = app.get_webview(&webview_id) {
        // Получаем title из менеджера (обновляется периодически)
        let state = app.state::<crate::AppState>();
        if let Ok(manager) = state.webview_manager.lock() {
            if let Some(info) = manager.get(&id) {
                return Ok(info.title.clone());
            }
        };
    }
    
    Err("WebView not found".to_string())
}
