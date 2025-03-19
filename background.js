console.log('background.js cargado');

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url && changeInfo.url.includes('youtube.com/watch')) {
		const queryParameters = changeInfo.url.split('?')[1];
		const urlParameters = new URLSearchParams(queryParameters);
		const videoId = urlParameters.get('v');

		console.log('sendMessage NEW', videoId);

		// Primero verifica si content.js está listo
		chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
			if (chrome.runtime.lastError || !response) {
				console.warn('content.js aún no está listo, esperando...');
				setTimeout(() => {
					chrome.tabs.sendMessage(tabId, { type: 'NEW', videoId: videoId });
				}, 500);
			} else {
				// content.js está listo, enviamos el mensaje
				chrome.tabs.sendMessage(tabId, { type: 'NEW', videoId: videoId });
			}
		});
	}
});
