import { getActiveTabURL } from './utils.js';

// Enviar Eventos a la pestaña activa actual
const onPlay = async (e) => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
	const activeTab = await getActiveTabURL();

	chrome.tabs.sendMessage(activeTab.id, {
		type: 'PLAY',
		value: bookmarkTime,
	});
};

const onDelete = async (e) => {
	const activeTab = await getActiveTabURL();
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
	const bookmarkElementToDelete = document.getElementById('bookmark-' + bookmarkTime);

	bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

	chrome.tabs.sendMessage(
		activeTab.id,
		{
			type: 'DELETE',
			value: bookmarkTime,
		},
		(response) => {
			console.log('response', response);

			if (response.status === 'OK') {
				renderBookmarks(response.bookmarks);
				return;
			}

			if (response.status === 'FAILED') {
				console.error('Error:', response);
			}
		}
	);
};

const addNewBookmark = (bookmarkListElement, bookmark) => {
	if (!bookmarkListElement) {
		throw new Error('[Bookmark list element] is required');
	}

	if (!bookmark) {
		throw new Error('[Bookmark] is required');
	}

	const bookmarkTitleElement = document.createElement('div');
	const controlsElement = document.createElement('div');
	const newBookmarkElement = document.createElement('div');

	bookmarkTitleElement.textContent = bookmark.desc;
	bookmarkTitleElement.className = 'bookmark-title';
	controlsElement.className = 'bookmark-controls';

	setBookmarkAttributes('play', onPlay, controlsElement);
	setBookmarkAttributes('delete', onDelete, controlsElement);

	newBookmarkElement.id = 'bookmark-' + bookmark.time;
	newBookmarkElement.className = 'bookmark';
	newBookmarkElement.setAttribute('timestamp', bookmark.time);

	newBookmarkElement.appendChild(bookmarkTitleElement);
	newBookmarkElement.appendChild(controlsElement);

	bookmarkListElement.appendChild(newBookmarkElement);
};

const renderBookmarks = (currentBookmarks = []) => {
	try {
		const bookmarkListElement = document.getElementById('bookmarkList');

		if (!bookmarkListElement) {
			throw new Error('[Bookmark list element] is required');
		}

		bookmarkListElement.innerHTML = '';

		if (currentBookmarks.length === 0) {
			bookmarkListElement.innerHTML = '<i class="row">No hay marcadores para mostrar</i>';
			return;
		}

		currentBookmarks.forEach((bookmark) => {
			addNewBookmark(bookmarkListElement, bookmark);
		});
	} catch (error) {
		console.error('Error al mostrar marcadores:', error?.message);
	}
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
	const controlElement = document.createElement('img');

	controlElement.src = 'assets/' + src + '.png';
	controlElement.title = src;
	controlElement.addEventListener('click', eventListener);

	controlParentElement.appendChild(controlElement);
};

document.addEventListener('DOMContentLoaded', async () => {
	const activeTab = await getActiveTabURL();
	const queryParameters = activeTab.url.split('?')?.[1];
	const urlParameters = new URLSearchParams(queryParameters);

	const currentVideo = urlParameters.get('v');
	console.log({ currentVideo });

	if (activeTab.url.includes('youtube.com/watch') && currentVideo) {
		chrome.storage.sync.get([currentVideo], (data) => {
			console.log({ data, currentVideo });

			const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

			console.log({ currentVideoBookmarks });
			renderBookmarks(currentVideoBookmarks);
		});

		return;
	}

	const container = document.querySelector('.container');
	container.innerHTML = '<div class="title">Esta no es una página de vídeos de youtube.</div>';
});
