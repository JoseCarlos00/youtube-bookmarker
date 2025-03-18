class YoutubeBookmarker {
	constructor() {
		this.youtubeLeftControls = null;
		this.youtubePlayer = null;
		this.youtubeTooltipWrapper = null;

		this.currentButtonBookmarker = null;
		this.currentVideo = '';
		this.currentVideoBookmarks = [];

		this.observeDOMChanges();
	}

	observeDOMChanges() {
		console.log('observeDOMChanges');

		let initialize = false;

		const observer = new MutationObserver(() => {
			if (!this.youtubeLeftControls) {
				this.youtubeLeftControls = document.querySelector('#player-container .ytp-left-controls');
			}

			if (!this.youtubePlayer) {
				this.youtubePlayer = document.querySelector('#player-container .video-stream');
			}

			if (!this.youtubeTooltipWrapper) {
				this.youtubeTooltipWrapper = document.querySelector('#player-container .ytp-tooltip');
			}

			if (this.youtubeLeftControls && this.youtubePlayer && !initialize) {
				console.log('Elementos encontrados, inicializando...');
				this.init();
				initialize = true;
			}

			if (this.youtubeTooltipWrapper && initialize) {
				const tooltipWrapperFound = new Event('tooltipWrapperFound');
				window.dispatchEvent(tooltipWrapperFound);

				observer.disconnect(); // Detiene la observación una vez que los elementos están listos
			}
		});

		// Observar cambios en el `body` porque YouTube actualiza dinámicamente el DOM
		observer.observe(document.body, { childList: true, subtree: true });
	}

	init() {
		try {
			console.log('Inicializando YouTubeBookmarker...');
			this.newVideoLoaded();

			window.addEventListener('tooltipWrapperFound', () => {
				console.log('Wrapper de tooltip encontrado Event handler');

				if (!this.currentButtonBookmarker) {
					console.error('No se encontró el botón de bookmarker actual');
				}

				this.setEventMouseButton(this.currentButtonBookmarker);
			});
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
			desc: 'Marcar en ' + getTime(currentTime),
		};

		this.currentVideoBookmarks = await this.fetchBookmarks();
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

	setEventMouseButton(bookmarkBtn) {
		if (!bookmarkBtn) {
			throw new Error('[createButtonElement]: Bookmark button not found');
		}

		console.log({ youtubeTooltipWrapper: document.querySelector('#player-container .ytp-tooltip') });

		if (!this.youtubeTooltipWrapper) {
			throw new Error('[createButtonElement]: Tooltip wrapper not found');
		}

		bookmarkBtn.addEventListener('mouseover', (e) => handleEventMouseButton(e));
		bookmarkBtn.addEventListener('mouseout', (e) => handleEventMouseButton(e));

		const titleMark = 'Haz clic agregar un marcador';
		const titleWrapper = this.youtubeTooltipWrapper.querySelector('.ytp-tooltip-text-no-title .ytp-tooltip-text');

		const handleEventMouseButton = (e) => {
			const { type, target } = e;

			if (type === 'mouseover') {
				console.log('En movimiento', titleWrapper);
				titleWrapper?.innerHTML = titleMark;
				bookmarkBtn.removeAttribute('title');

				this.youtubeTooltipWrapper.style.removeProperty('display');
				this.youtubeTooltipWrapper.style.left = '160.5px';
				return;
			}

			if (type === 'mouseout') {
				console.log('Fuera del elemento');
				bookmarkBtn.setAttribute('title', titleMark);
				this.youtubeTooltipWrapper.style.display = 'none';
			}
		};
	}

	createButtonElement() {
		const bookmarkBtn = document.createElement('button');

		const titleMark = 'Haz clic agregar un marcador';

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
		console.log('Nuevo video detectado');

		if (!this.youtubeLeftControls) {
			throw new Error('Could not find the YouTube left controls');
		}

		const bookmarkBtnExists = document.querySelector('.ytp-button.bookmark-btn');

		this.currentVideoBookmarks = await this.fetchBookmarks();

		if (!bookmarkBtnExists) {
			const bookmarkBtn = this.createButtonElement();

			this.currentButtonBookmarker = bookmarkBtn;
			this.youtubeLeftControls.appendChild(bookmarkBtn);

			console.log(this.youtubeLeftControls, bookmarkBtn);

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
		console.log({
			'container:': document.querySelector('#container'),
			content: document.querySelector('#container')?.innerHTML,
		});
	} catch (error) {
		console.error('Error crear instancia YoutubeBookmarker:', error);
	}
});
