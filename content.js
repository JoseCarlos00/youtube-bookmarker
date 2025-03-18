class YoutubeBookmarker {
	constructor() {
		this.youtubeLeftControls = null;
		this.youtubePlayer = null;
		this.currentVideoBookmarks = [];

		// newVideoLoaded();
	}

	fetchBookmarks = () => {
		return new Promise((resolve) => {
			chrome.storage.sync.get([currentVideo], (obj) => {
				resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
			});
		});
	};

	addNewBookmarkEventHandler = async () => {
		const currentTime = youtubePlayer.currentTime;
		const newBookmark = {
			time: currentTime,
			desc: 'Bookmark at ' + getTime(currentTime),
		};

		currentVideoBookmarks = await fetchBookmarks();

		chrome.storage.sync.set({
			[currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)),
		});
	};

	getTime = (t) => {
		let date = new Date(0);
		date.setSeconds(t);

		return date.toISOString().substring(11, 19);
	};

	newVideoLoaded = async () => {
		const bookmarkBtnExists = document.getElementsByClassName('bookmark-btn')[0];

		currentVideoBookmarks = await fetchBookmarks();

		if (!bookmarkBtnExists) {
			const bookmarkBtn = document.createElement('img');

			bookmarkBtn.src = chrome.runtime.getURL('assets/bookmark.png');
			bookmarkBtn.className = 'ytp-button ' + 'bookmark-btn';
			bookmarkBtn.title = 'Click to bookmark current timestamp';

			youtubeLeftControls = document.getElementsByClassName('ytp-left-controls')[0];
			youtubePlayer = document.getElementsByClassName('video-stream')[0];

			youtubeLeftControls.appendChild(bookmarkBtn);
			bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);
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
