class YoutubeBookmarker {
	constructor() {
		this.youtubeLeftControls = document.querySelector('.ytp-left-controls');
		this.youtubePlayer = document.querySelector('.video-stream');
		this.currentVideoBookmarks = [];

		newVideoLoaded();
	}

	fetchBookmarks = () => {
		return new Promise((resolve) => {
			chrome.storage.sync.get([currentVideo], (obj) => {
				resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
			});
		});
	};

	addNewBookmarkEventHandler = async () => {
		const currentTime = this.youtubePlayer.currentTime;

		const newBookmark = {
			time: currentTime,
			desc: 'Marcar en ' + getTime(currentTime),
		};

		this.currentVideoBookmarks = await fetchBookmarks();
		console.log('this.currentVideoBookmarks:', this.currentVideoBookmarks);

		chrome.storage.sync.set({
			[currentVideo]: JSON.stringify([...this.currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)),
		});
	};

	getTime = (t) => {
		let date = new Date(0);
		date.setSeconds(t);

		return date.toISOString().substring(11, 19);
	};

	newVideoLoaded = async () => {
		const bookmarkBtnExists = document.querySelector('.ytp-button.bookmark-btn');
		console.log('bookmarkBtnExists:', bookmarkBtnExists);

		this.currentVideoBookmarks = await fetchBookmarks();

		if (!bookmarkBtnExists) {
			const bookmarkBtn = document.createElement('img');

			bookmarkBtn.src = chrome.runtime.getURL('assets/bookmark.svg');
			bookmarkBtn.className = 'ytp-button ' + 'bookmark-btn';
			bookmarkBtn.title = 'Haz clic para marcar la hora actual';

			this.youtubeLeftControls.appendChild(bookmarkBtn);
			bookmarkBtn.addEventListener('click', this.addNewBookmarkEventHandler);
		}
	};

	eventChromeOnMessage() {
		try {
			chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
				const { type, value, videoId } = message;

				console.log({ message });

				// if (type === 'NEW') {
				// 	currentVideo = videoId;
				// 	newVideoLoaded();
				// } else if (type === 'PLAY') {
				// 	youtubePlayer.currentTime = value;
				// } else if (type === 'DELETE') {
				// 	currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
				// 	chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

				// 	response(currentVideoBookmarks);
				// }
			});
		} catch (error) {
			console.error('Error in chrome.runtime.onMessage.addListener:', error);
		}
	}
}

window.addEventListener('load', () => {
	new YoutubeBookmarker();
	console.warn('Contenido cargado');
});
