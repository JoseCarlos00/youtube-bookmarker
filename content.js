class YoutubeBookmarker {
	constructor() {
		this.youtubeLeftControls = null;
		this.youtubePlayer = null;

		this.currentButtonBookmarker = null;
		this.currentVideo = '';
		this.currentVideoBookmarks = [];

		this.observeDOMChanges();
	}

	observeDOMChanges() {
		const observer = new MutationObserver(() => {
			if (!this.youtubeLeftControls) {
				this.youtubeLeftControls = document.querySelector('#player-container .ytp-left-controls');
			}

			if (!this.youtubePlayer) {
				this.youtubePlayer = document.querySelector('#player-container .video-stream');
			}

			if (this.youtubeLeftControls && this.youtubePlayer) {
				console.log('Elementos encontrados, inicializando...');
				observer.disconnect(); // Detiene la observación una vez que los elementos están listos
				this.init();
			}
		});

		// Observar cambios en el `body` porque YouTube actualiza dinámicamente el DOM
		observer.observe(document.body, { childList: true, subtree: true });
	}

	init() {
		try {
			console.log('Inicializando YouTubeBookmarker...');
			this.newVideoLoaded();
			this.eventChromeOnMessage();
		} catch (error) {
			console.error('Error en init():', error);
		}
	}

	fetchBookmarks = () => {
		return new Promise((resolve) => {
			chrome.storage.sync.get([this.currentVideo], (obj) => {
				resolve(obj[this.currentVideo] ? JSON.parse(obj[this.currentVideo]) : []);
			});
		});
	};

	addNewBookmarkEventHandler = async () => {
		if (!this.youtubePlayer) {
			throw new Error('Could not find the YouTube player');
		}

		const currentTime = this.youtubePlayer.currentTime;

		const newBookmark = {
			time: currentTime,
			desc: 'Marcar en ' + this.getTime(currentTime),
		};

		this.currentVideoBookmarks = await this.fetchBookmarks();
		console.log('this.currentVideoBookmarks:', this.currentVideoBookmarks);

		const isExists = this.currentVideoBookmarks.find((bookmark) => {
			return bookmark.time === currentTime;
		});

		console.log({ isExists });

		if (!isExists) {
			console.warn('Ya existe un marcador en este momento');
			return;
		}

		chrome.storage.sync.set({
			[this.currentVideo]: JSON.stringify([...this.currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)),
		});
	};

	getTime = (t) => {
		let date = new Date(0);
		date.setSeconds(t);

		return date.toISOString().substring(11, 19);
	};

	setEventMouseButton(bookmarkBtn) {
		if (!bookmarkBtn) {
			throw new Error('[createButtonElement]: Bookmark button not found');
		}

		console.log({ youtubeTooltipWrapper: document.querySelector('#player-container .ytp-tooltip') });

		bookmarkBtn.addEventListener('mouseover', (e) => handleEventMouseButton(e));
		bookmarkBtn.addEventListener('mouseout', (e) => handleEventMouseButton(e));

		const titleMark = 'Haz clic para agregar un marcador';

		const handleEventMouseButton = (e) => {
			const { type } = e;
			const youtubeTooltipWrapper = document.querySelector('#player-container .ytp-tooltip');
			const tooltipTextNoTitle = youtubeTooltipWrapper?.querySelector('.ytp-tooltip-text-no-title .ytp-tooltip-text');
			const tooltipBg = youtubeTooltipWrapper?.querySelector('.ytp-tooltip-bg');

			if (!youtubeTooltipWrapper || !tooltipTextNoTitle) {
				console.warn('Tooltip wrapper or text not found');
				return;
			}

			if (type === 'mouseover') {
				tooltipTextNoTitle.innerHTML = titleMark;
				bookmarkBtn.removeAttribute('title');

				youtubeTooltipWrapper.style.removeProperty('display');
				youtubeTooltipWrapper.classList.remove('ytp-preview');
				youtubeTooltipWrapper.style.top = '188px';
				youtubeTooltipWrapper.style.left = '160.5px';
				youtubeTooltipWrapper.removeAttribute('aria-hidden');
				tooltipBg && tooltipBg.style.removeProperty('background');

				return;
			}

			if (type === 'mouseout') {
				bookmarkBtn.setAttribute('title', titleMark);
				youtubeTooltipWrapper.style.display = 'none';
				youtubeTooltipWrapper.setAttribute('aria-hidden', 'true');
			}
		};
	}

	createButtonElement() {
		const bookmarkBtn = document.createElement('button');

		const titleMark = 'Haz clic para agregar un marcador';

		bookmarkBtn.className = 'ytp-button ' + 'bookmark-btn';
		bookmarkBtn.title = titleMark;
		bookmarkBtn.style = 'display: inline-flex; align-items: center;';
		bookmarkBtn.setAttribute('data-title-no-tooltip', titleMark);

		bookmarkBtn.innerHTML = /*html*/ `
			<svg class="ytp-subtitles-button-icon" width="22" height="20" viewBox="0 0 384 512" fill-opacity="1">
  			<path
    		d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"
    		fill="currentColor" />
			</svg>
			`;

		return bookmarkBtn;
	}

	newVideoLoaded = async () => {
		console.log('New video loaded');

		if (!this.youtubeLeftControls) {
			throw new Error('Could not find the YouTube left controls');
		}

		const bookmarkBtnExists = document.querySelector('.ytp-button.bookmark-btn');

		this.currentVideoBookmarks = await this.fetchBookmarks();

		if (bookmarkBtnExists) {
			const bookmarkBtn = this.createButtonElement();

			this.setEventMouseButton(bookmarkBtn);
			this.youtubeLeftControls.appendChild(bookmarkBtn);
			console.log({ bookmarkBtn, youtubeLeftControls: this.youtubeLeftControls });

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
	try {
		console.warn('Contenido cargado');
		new YoutubeBookmarker();
	} catch (error) {
		console.error('Error crear instancia YoutubeBookmarker:', error);
	}
});
