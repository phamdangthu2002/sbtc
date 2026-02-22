// API Endpoints (đảm bảo đã có dòng này ở đầu file)
const API_LIST = "https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat";
const API_SEARCH = (query, page = 1) => `https://ophim1.com/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&page=${page}`;
const API_DETAIL = (slug) => `https://ophim1.com/v1/api/phim/${slug}`;

// Global state
let allMovies = [];
let currentFilter = 'all';
let currentSort = 'latest';
let searchTimeout;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupThemeToggle();
    setupScrollToTop();
    setupNavbarScroll();
    setupMobileMenu();

    // Route to appropriate page handler
    if (document.getElementById("movie-list") || document.getElementById("featured-movies")) {
        initHomePage();
    }

    if (document.getElementById("movie-detail")) {
        initDetailPage();
    }
}

// ==================== THEME TOGGLE ====================
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ==================== SCROLL TO TOP ====================
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scroll-top');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==================== NAVBAR SCROLL EFFECT ====================
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ==================== MOBILE MENU ====================
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!mobileToggle || !navLinks) return;

    mobileToggle.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(0, 0, 0, 0.95)';
        navLinks.style.flexDirection = 'column';
        navLinks.style.padding = '1rem';
    });
}

// ==================== HOME PAGE ====================
function initHomePage() {
    showLoading();
    fetchMovies();
    setupSearch();
    setupFilters();
    setupSort();
}

function fetchMovies() {
    fetch(API_LIST)
        .then(res => res.json())
        .then(data => {
            allMovies = data.data.items;
            displayMovies();
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            hideLoading();
            showError();
        });
}

function displayMovies() {
    let filteredMovies = filterMovies(allMovies);
    let sortedMovies = sortMovies(filteredMovies);

    // Display in different sections
    displayFeaturedMovies(sortedMovies.slice(0, 12));
    displayNewMovies(sortedMovies.slice(0, 12));
    displayTrendingMovies(sortedMovies.slice(0, 12));

    // Display main list if exists
    const movieList = document.getElementById("movie-list");
    if (movieList) {
        renderMovieGrid(movieList, sortedMovies);
    }
}

function displayFeaturedMovies(movies) {
    const container = document.getElementById("featured-movies");
    if (container) {
        renderMovieGrid(container, movies);
    }
}

function displayNewMovies(movies) {
    const container = document.getElementById("new-movies");
    if (container) {
        renderMovieGrid(container, movies);
    }
}

function displayTrendingMovies(movies) {
    const container = document.getElementById("trending-movies");
    if (container) {
        renderMovieGrid(container, movies);
    }
}

function renderMovieGrid(container, movies) {
    container.innerHTML = "";

    if (movies.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-film" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-secondary); font-size: 1.1rem;">Không tìm thấy phim nào</p>
            </div>
        `;
        return;
    }

    movies.forEach(movie => {
        const div = document.createElement("div");
        div.className = "movie";

        const year = movie.year || 'N/A';
        const quality = movie.quality || 'HD';
        const lang = movie.lang || 'Vietsub';

        div.innerHTML = `
            <div class="movie-image-wrapper">
                <img src="https://img.ophim.live/uploads/movies/${movie.poster_url}" 
                     alt="${movie.name}"
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22280%22><rect fill=%22%231a1a1a%22 width=%22200%22 height=%22280%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>No Image</text></svg>'">
                <div class="movie-overlay">
                    <i class="fas fa-play-circle"></i>
                </div>
                <span class="movie-badge">${quality}</span>
            </div>
            <div class="movie-info">
                <h3>${movie.name}</h3>
                <div class="movie-meta">
                    <span class="rating">
                        <i class="fas fa-star"></i> ${movie.episode_current || 'Full'}
                    </span>
                    <span>${year}</span>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            window.location.href = `detail.html?slug=${movie.slug}`;
        });

        container.appendChild(div);
    });
}

// ==================== SEARCH FUNCTIONALITY ====================
// function setupSearch() {
//     const searchInputs = document.querySelectorAll('#search, #hero-search');
//     const searchDropdown = document.getElementById('search-results');

//     searchInputs.forEach(input => {
//         if (!input) return;

//         input.addEventListener('input', function(e) {
//             const query = this.value.trim();

//             clearTimeout(searchTimeout);

//             if (query.length === 0) {
//                 if (searchDropdown) {
//                     searchDropdown.classList.remove('active');
//                 }
//                 // Khi xóa tìm kiếm → quay về danh sách mặc định
//                 searchResults = [];
//                 displayMovies(); // hiển thị lại phim từ allMovies
//                 return;
//             }

//             if (query.length < 2) return;

//             searchTimeout = setTimeout(() => {
//                 performSearch(query);
//             }, 300);
//         });

//         // Xử lý nhấn Enter (đặc biệt với hero search)
//         if (input.id === 'hero-search') {
//             input.addEventListener('keypress', function(e) {
//                 if (e.key === 'Enter') {
//                     e.preventDefault(); // Ngăn hành vi mặc định của form nếu có
//                     const query = this.value.trim();
//                     if (query.length > 0) {
//                         performSearch(query);
//                         // Đồng bộ với thanh tìm kiếm header
//                         const headerSearch = document.getElementById('search');
//                         if (headerSearch) {
//                             headerSearch.value = query;
//                         }
//                     }
//                 }
//             });
//         }
//     });

//     // Đóng dropdown khi click ra ngoài
//     document.addEventListener('click', (e) => {
//         if (searchDropdown && !e.target.closest('.search-container')) {
//             searchDropdown.classList.remove('active');
//         }
//     });
// }

function setupSearch() {

    const searchInputs = document.querySelectorAll('#search, #hero-search');
    const searchDropdown = document.getElementById('search-results');

    const searchContainer = document.querySelector('.search-container');
    const overlay = document.getElementById('search-overlay');
    const closeBtn = document.getElementById('search-close');


    // ================= MỞ POPUP =================

    searchInputs.forEach(input => {

        if (!input) return;

        // Focus → mở popup
        input.addEventListener('focus', () => {

            if (searchContainer) {
                searchContainer.classList.add('active');
            }

            if (overlay) {
                overlay.classList.add('active');
            }

            // Mobile tránh bàn phím che
            if (window.innerWidth < 600) {
                setTimeout(() => {
                    input.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 200);
            }
        });


        // ================= INPUT =================

        input.addEventListener('input', function () {

            const query = this.value.trim();

            clearTimeout(searchTimeout);


            // Rỗng → reset
            if (query.length === 0) {

                if (searchDropdown) {
                    searchDropdown.classList.remove('active');
                    searchDropdown.innerHTML = '';
                }

                // Quay về danh sách gốc
                searchResults = [];
                displayMovies();

                return;
            }


            // Ít hơn 2 ký tự → chưa search
            if (query.length < 2) return;


            // Debounce
            searchTimeout = setTimeout(() => {

                performSearch(query);

            }, 300);
        });


        // ================= ENTER (HERO SEARCH) =================

        if (input.id === 'hero-search') {

            input.addEventListener('keypress', function (e) {

                if (e.key === 'Enter') {

                    e.preventDefault();

                    const query = this.value.trim();

                    if (query.length > 0) {

                        performSearch(query);

                        // Sync header search
                        const headerSearch = document.getElementById('search');

                        if (headerSearch) {
                            headerSearch.value = query;
                        }
                    }
                }
            });
        }

    });


    // ================= ĐÓNG POPUP =================

    function closeSearch() {

        if (searchContainer) {
            searchContainer.classList.remove('active');
        }

        if (overlay) {
            overlay.classList.remove('active');
        }

        if (searchDropdown) {
            searchDropdown.classList.remove('active');
        }

        document.querySelectorAll('#search, #hero-search').forEach(input => {
            input.blur();
        });
    }


    // Click overlay → đóng
    if (overlay) {
        overlay.addEventListener('click', closeSearch);
    }


    // Click nút ❌
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSearch);
    }


    // ESC → đóng
    document.addEventListener('keydown', (e) => {

        if (e.key === 'Escape') {
            closeSearch();
        }
    });


    // ================= CLICK NGOÀI =================

    document.addEventListener('click', (e) => {

        if (
            searchDropdown &&
            !e.target.closest('.search-container') &&
            !e.target.closest('#hero-search')
        ) {
            searchDropdown.classList.remove('active');
        }
    });
}

function performSearch(query) {
    showLoading();

    fetch(API_SEARCH(query))
        .then(res => res.json())
        .then(data => {
            searchResults = data.data?.items || [];

            // Dropdown gợi ý
            const searchDropdown = document.getElementById('search-results');
            if (searchDropdown) {
                displaySearchResults(searchResults.slice(0, 5), searchDropdown);
            }

            // CHỈ cập nhật lưới phim chính, KHÔNG cập nhật các section hot
            updateUIWithSearchResults(searchResults);

            hideLoading();
        })
        .catch(error => {
            console.error('Lỗi tìm kiếm:', error);
            hideLoading();
            // Thông báo lỗi nếu cần
        });
}

// Hàm mới: Cập nhật toàn bộ UI trang chủ với kết quả tìm kiếm
// Hàm cập nhật UI khi tìm kiếm - chỉ thay đổi lưới phim chính (nếu có)
function updateUIWithSearchResults(results) {
    // Hiển thị kết quả vào lưới phim chính (nếu trang có id="movie-list")
    const movieList = document.getElementById("movie-list");
    if (movieList) {
        renderMovieGrid(movieList, results);

        // Nếu muốn thêm tiêu đề "Kết quả tìm kiếm cho: [từ khóa]"
        const searchQuery = document.querySelector('.search-container input').value.trim();
        if (searchQuery && movieList.parentElement) {
            let title = movieList.parentElement.querySelector('h2.section-title');
            if (!title) {
                title = document.createElement('h2');
                title.className = 'section-title';
                movieList.parentElement.insertBefore(title, movieList);
            }
            title.innerHTML = `<i class="fas fa-search"></i> Kết quả tìm kiếm: "${searchQuery}"`;
        }
    } else {
        // Nếu không có movie-list, có thể hiển thị thông báo ở một nơi nào đó
        console.log('Không tìm thấy lưới phim chính để hiển thị kết quả');
    }

    // Nếu không có kết quả → hiển thị thông báo trong lưới chính
    if (results.length === 0 && movieList) {
        movieList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>Không tìm thấy phim nào</h3>
                <p style="color: var(--text-secondary);">Thử tìm với từ khóa khác hoặc kiểm tra chính tả nhé!</p>
            </div>
        `;
    }
}

// Hàm hiển thị gợi ý tìm kiếm (dropdown)
function displaySearchResults(results, dropdown) {
    dropdown.innerHTML = '';

    if (results.length === 0) {
        dropdown.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Không tìm thấy kết quả</div>';
        dropdown.classList.add('active');
        return;
    }

    results.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <img src="https://img.ophim.live/uploads/movies/${movie.thumb_url || movie.poster_url}" 
                 alt="${movie.name}"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2270%22><rect fill=%22%231a1a1a%22 width=%2250%22 height=%2270%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2214%22>No Img</text></svg>'">
            <div class="search-item-info">
                <h4>${movie.name}</h4>
                <p>${movie.year || 'N/A'} • ${movie.episode_current || 'Full'} • ${movie.quality || 'HD'}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            window.location.href = `detail.html?slug=${movie.slug}`;
        });
        dropdown.appendChild(item);
    });

    dropdown.classList.add('active');
}

// ==================== FILTER FUNCTIONALITY ====================
function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            currentFilter = this.dataset.filter;
            displayMovies();
        });
    });

    // Category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function () {
            const category = this.dataset.category;
            // In a real app, this would filter by category
            console.log('Filter by category:', category);
        });
    });
}

function filterMovies(movies) {
    if (currentFilter === 'all') {
        return movies;
    }

    return movies.filter(movie => {
        if (currentFilter === 'phim-le') {
            return movie.type === 'single';
        } else if (currentFilter === 'phim-bo') {
            return movie.type === 'series';
        } else if (currentFilter === 'tv-shows') {
            return movie.type === 'tvshows';
        } else if (currentFilter === 'hoat-hinh') {
            return movie.category && movie.category.some(cat =>
                cat.slug === 'hoat-hinh'
            );
        }
        return true;
    });
}

// ==================== SORT FUNCTIONALITY ====================
function setupSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function () {
        currentSort = this.value;
        displayMovies();
    });
}

function sortMovies(movies) {
    const sorted = [...movies];

    switch (currentSort) {
        case 'latest':
            return sorted.sort((a, b) => {
                return new Date(b.modified?.time || 0) - new Date(a.modified?.time || 0);
            });
        case 'year':
            return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sorted;
    }
}

// ==================== DETAIL PAGE ====================
function initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    showLoading();
    fetchMovieDetail(slug);
    setupTabs();
    setupPlayerControls();
}

function fetchMovieDetail(slug) {
    fetch(API_DETAIL(slug))
        .then(res => res.json())
        .then(data => {
            const movie = data.data.item;
            displayMovieDetail(movie);
            displayEpisodes(movie);
            displayRelatedMovies();
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching movie detail:', error);
            hideLoading();
            showError();
        });
}

function displayMovieDetail(movie) {
    // Update hero background
    const movieHero = document.getElementById('movie-hero');
    if (movieHero && movie.poster_url) {
        movieHero.style.backgroundImage = `url(https://img.ophim.live/uploads/movies/${movie.poster_url})`;
        movieHero.style.backgroundSize = 'cover';
        movieHero.style.backgroundPosition = 'center';
    }

    // Update page title
    document.title = `${movie.name} - CineHub`;

    const detailContainer = document.getElementById("movie-detail");
    if (!detailContainer) return;

    const directors = movie.director?.join(', ') || 'Đang cập nhật';
    const actors = movie.actor?.join(', ') || 'Đang cập nhật';
    const categories = movie.category?.map(cat => cat.name).join(', ') || 'Đang cập nhật';
    const countries = movie.country?.map(c => c.name).join(', ') || 'Đang cập nhật';

    detailContainer.innerHTML = `
        <div class="movie-poster">
            <img src="https://img.ophim.live/uploads/movies/${movie.poster_url}" 
                 alt="${movie.name}"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22><rect fill=%22%231a1a1a%22 width=%22300%22 height=%22450%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>No Image</text></svg>'">
            <div class="movie-actions">
                <button class="action-btn" title="Thích">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="action-btn" title="Danh sách">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="action-btn" title="Chia sẻ">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
        <div class="movie-details">
            <h1>${movie.name}</h1>
            <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1rem;">
                ${movie.origin_name || ''}
            </p>
            
            <div class="movie-meta-info">
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${movie.year || 'N/A'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${movie.time || 'N/A'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-film"></i>
                    <span>${movie.episode_current || 'N/A'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-closed-captioning"></i>
                    <span>${movie.lang || 'Vietsub'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-star"></i>
                    <span>${movie.quality || 'HD'}</span>
                </div>
            </div>
            
            <div class="movie-tags">
                ${movie.category?.map(cat => `<span class="tag">${cat.name}</span>`).join('') || ''}
            </div>
            
            <div class="movie-description">
                <p>${movie.content || movie.description || 'Đang cập nhật nội dung...'}</p>
            </div>
            
            <div class="movie-stats">
                <div class="stat-item">
                    <span class="stat-value">${movie.view || '0'}</span>
                    <span class="stat-label">Lượt xem</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${movie.episode_total || movie.episode_current || 'N/A'}</span>
                    <span class="stat-label">Tập phim</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${movie.year || 'N/A'}</span>
                    <span class="stat-label">Năm sản xuất</span>
                </div>
            </div>
        </div>
    `;

    // Update overview tab
    const overviewTab = document.getElementById('movie-overview');
    if (overviewTab) {
        overviewTab.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div>
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">
                        <i class="fas fa-user-tie"></i> Đạo diễn
                    </h4>
                    <p style="color: var(--text-secondary);">${directors}</p>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">
                        <i class="fas fa-users"></i> Diễn viên
                    </h4>
                    <p style="color: var(--text-secondary);">${actors}</p>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">
                        <i class="fas fa-th-list"></i> Thể loại
                    </h4>
                    <p style="color: var(--text-secondary);">${categories}</p>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">
                        <i class="fas fa-globe"></i> Quốc gia
                    </h4>
                    <p style="color: var(--text-secondary);">${countries}</p>
                </div>
            </div>
        `;
    }

    // Display cast
    displayCast(movie.actor || []);
}

function displayCast(actors) {
    const castContainer = document.getElementById('movie-cast');
    if (!castContainer) return;

    if (!actors || actors.length === 0) {
        castContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Đang cập nhật thông tin diễn viên...</p>';
        return;
    }

    castContainer.innerHTML = actors.slice(0, 12).map(actor => `
        <div class="cast-item">
            <div class="cast-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="cast-name">${actor}</div>
            <div class="cast-role">Diễn viên</div>
        </div>
    `).join('');
}

function displayEpisodes(movie) {
    if (!movie.episodes || movie.episodes.length === 0) {
        document.getElementById('episodes-wrapper').style.display = 'none';
        return;
    }

    const episodes = movie.episodes[0].server_data;
    const episodesContainer = document.getElementById("episodes");

    if (!episodesContainer) return;

    episodesContainer.innerHTML = "";

    episodes.forEach((ep, index) => {
        const btn = document.createElement("div");
        btn.className = "episode";
        btn.textContent = ep.name;

        if (index === 0) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', function () {
            document.querySelectorAll('.episode').forEach(e => e.classList.remove('active'));
            this.classList.add('active');

            const iframe = document.getElementById("iframePlayer");
            if (iframe) {
                iframe.src = ep.link_embed;

                // Scroll to player
                document.getElementById('player-section').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });

        episodesContainer.appendChild(btn);
    });

    // Load first episode
    const iframe = document.getElementById("iframePlayer");
    if (iframe && episodes.length > 0) {
        iframe.src = episodes[0].link_embed;
    }

    // Setup episode sorting
    setupEpisodeSort(episodes);
}

function setupEpisodeSort(episodes) {
    const sortButtons = document.querySelectorAll('.episodes-sort');

    sortButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const sortOrder = this.dataset.sort;
            const episodesContainer = document.getElementById("episodes");
            const episodeElements = Array.from(episodesContainer.children);

            if (sortOrder === 'desc') {
                episodeElements.reverse();
            }

            episodesContainer.innerHTML = '';
            episodeElements.forEach(el => episodesContainer.appendChild(el));
        });
    });
}

function displayRelatedMovies() {
    // Fetch related movies from main list
    if (allMovies.length === 0) {
        fetch(API_LIST)
            .then(res => res.json())
            .then(data => {
                allMovies = data.data.items;
                const relatedContainer = document.getElementById('related-movies');
                if (relatedContainer) {
                    renderMovieGrid(relatedContainer, allMovies.slice(0, 12));
                }
            });
    } else {
        const relatedContainer = document.getElementById('related-movies');
        if (relatedContainer) {
            renderMovieGrid(relatedContainer, allMovies.slice(0, 12));
        }
    }
}

// ==================== TABS ====================
function setupTabs() {
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabContents = document.querySelectorAll('.tab-content');

    tabHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const targetTab = this.dataset.tab;

            tabHeaders.forEach(h => h.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// ==================== PLAYER CONTROLS ====================
function setupPlayerControls() {
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    const iframe = document.getElementById('iframePlayer');

    if (fullscreenBtn && iframe) {
        fullscreenBtn.addEventListener('click', () => {
            const playerWrapper = iframe.parentElement;
            if (playerWrapper.requestFullscreen) {
                playerWrapper.requestFullscreen();
            } else if (playerWrapper.webkitRequestFullscreen) {
                playerWrapper.webkitRequestFullscreen();
            } else if (playerWrapper.msRequestFullscreen) {
                playerWrapper.msRequestFullscreen();
            }
        });
    }

    // Comments
    const submitComment = document.getElementById('submit-comment');
    const commentInput = document.getElementById('comment-input');

    if (submitComment && commentInput) {
        submitComment.addEventListener('click', () => {
            const text = commentInput.value.trim();
            if (text) {
                addComment(text);
                commentInput.value = '';
            }
        });
    }
}

function addComment(text) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    commentItem.innerHTML = `
        <div class="comment-avatar">
            <i class="fas fa-user-circle"></i>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">Bạn</span>
                <span class="comment-time">Vừa xong</span>
            </div>
            <p class="comment-text">${text}</p>
        </div>
    `;

    commentsList.insertBefore(commentItem, commentsList.firstChild);
}

// ==================== LOADING & ERROR ====================
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('active');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('active');
    }
}

function showError() {
    const containers = [
        document.getElementById('movie-list'),
        document.getElementById('featured-movies'),
        document.getElementById('new-movies'),
        document.getElementById('trending-movies')
    ];

    containers.forEach(container => {
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">Lỗi tải dữ liệu</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Không thể tải danh sách phim. Vui lòng thử lại sau.
                    </p>
                    <button onclick="location.reload()" class="btn-primary">
                        <i class="fas fa-redo"></i> Tải lại trang
                    </button>
                </div>
            `;
        }
    });
}

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
// ==================== FOOTER DYNAMIC CONTENT ====================
// ==================== FOOTER DYNAMIC CONTENT ====================
function initFooter() {
    const API_GENRES = 'https://ophim1.com/v1/api/the-loai';
    const API_COUNTRIES = 'https://ophim1.com/v1/api/quoc-gia';
    const API_YEARS = 'https://ophim1.com/v1/api/nam-phat-hanh';

    console.log('Bắt đầu load footer data...');

    // Thể loại
    fetch(API_GENRES)
        .then(res => {
            console.log('Thể loại status:', res.status);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('Thể loại data:', data);
            const items = data?.data?.items || [];
            if (Array.isArray(items) && items.length > 0) {
                renderFooterList('footer-genres-list', items, 'the-loai', 'name', 'slug');
            } else {
                console.warn('Không có items trong thể loại');
                renderFallbackList('footer-genres-list');
            }
        })
        .catch(err => {
            console.error('Lỗi load thể loại:', err);
            renderFallbackList('footer-genres-list');
        });

    // Quốc gia
    fetch(API_COUNTRIES)
        .then(res => {
            console.log('Quốc gia status:', res.status);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('Quốc gia data:', data);
            const items = data?.data?.items || [];
            if (Array.isArray(items) && items.length > 0) {
                renderFooterList('footer-countries-list', items, 'quoc-gia', 'name', 'slug');
            } else {
                renderFallbackList('footer-countries-list');
            }
        })
        .catch(err => {
            console.error('Lỗi load quốc gia:', err);
            renderFallbackList('footer-countries-list');
        });

    // Năm phát hành
    fetch(API_YEARS)
        .then(res => {
            console.log('Năm status:', res.status);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('Năm data:', data);
            const items = data?.data?.items || [];
            if (Array.isArray(items) && items.length > 0) {
                renderFooterList('footer-years-list', items, 'nam-phat-hanh', null, null, true);
            } else {
                renderFallbackList('footer-years-list');
            }
        })
        .catch(err => {
            console.error('Lỗi load năm:', err);
            renderFallbackList('footer-years-list');
        });
}

// Hàm render (giữ nguyên, chỉ tinh chỉnh slug cho an toàn hơn)
function renderFooterList(listId, items, basePath, nameKey = 'name', slugKey = 'slug', isYear = false) {
    const container = document.getElementById(listId);
    if (!container) return;

    container.innerHTML = '';

    const displayItems = items.slice(0, 12);

    displayItems.forEach(item => {
        let name, slug;
        if (isYear) {
            name = typeof item === 'object' ? (item.name || item.year || item) : item;
            slug = name;
        } else {
            name = item[nameKey] || item.name || String(item);
            slug = item[slugKey] || item.slug || name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                .replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-');
        }

        const li = document.createElement('li');
        // Sử dụng link query string thay vì .html
        li.innerHTML = `<a href="phim-loc.html?type=${basePath}&slug=${slug}">${name}</a>`;
        container.appendChild(li);
    });

    // Link "Xem tất cả"
    const allLi = document.createElement('li');
    allLi.innerHTML = `<a href="phim-loc.html?type=${basePath}&slug=all">Xem tất cả</a>`;
    container.appendChild(allLi);
}

// Fallback (giữ nguyên)
function renderFallbackList(listId) {
    const container = document.getElementById(listId);
    if (!container) return;

    let html = '';

    switch (listId) {
        case 'footer-genres-list':
            html = `
                <li><a href="phim-loc.html?type=the-loai&slug=hanh-dong">Hành Động</a></li>
                <li><a href="phim-loc.html?type=the-loai&slug=hai-huoc">Hài Hước</a></li>
                <li><a href="phim-loc.html?type=the-loai&slug=tinh-cam">Tình Cảm</a></li>
                <li><a href="phim-loc.html?type=the-loai&slug=kinh-di">Kinh Dị</a></li>
                <li><a href="phim-loc.html?type=the-loai&slug=hoat-hinh">Hoạt Hình</a></li>
                <li><a href="phim-loc.html?type=the-loai">Xem thêm thể loại</a></li>
            `;
            break;

        case 'footer-countries-list':
            html = `
                <li><a href="phim-loc.html?type=quoc-gia&slug=viet-nam">Việt Nam</a></li>
                <li><a href="phim-loc.html?type=quoc-gia&slug=han-quoc">Hàn Quốc</a></li>
                <li><a href="phim-loc.html?type=quoc-gia&slug=thai-lan">Thái Lan</a></li>
                <li><a href="phim-loc.html?type=quoc-gia&slug=my">Mỹ</a></li>
                <li><a href="phim-loc.html?type=quoc-gia&slug=trung-quoc">Trung Quốc</a></li>
                <li><a href="phim-loc.html?type=quoc-gia">Xem thêm quốc gia</a></li>
            `;
            break;

        case 'footer-years-list':
            html = `
                <li><a href="phim-loc.html?type=nam-phat-hanh&slug=2025">2025</a></li>
                <li><a href="phim-loc.html?type=nam-phat-hanh&slug=2024">2024</a></li>
                <li><a href="phim-loc.html?type=nam-phat-hanh&slug=2023">2023</a></li>
                <li><a href="phim-loc.html?type=nam-phat-hanh&slug=2022">2022</a></li>
                <li><a href="phim-loc.html?type=nam-phat-hanh&slug=2021">2021</a></li>
                <li><a href="phim-loc.html?type=nam-phat-hanh">Xem thêm năm</a></li>
            `;
            break;

        default:
            html = '<li><a href="#">Không có dữ liệu dự phòng</a></li>';
    }

    container.innerHTML = html;
}



// ==================== QUICK FILTERS - LỌC TRỰC TIẾP TỪ API ====================

// Map filter với endpoint Ophim thực tế
const FILTER_ENDPOINTS = {
    'all': 'https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=1',
    'phim-le': 'https://ophim1.com/v1/api/danh-sach/phim-le?page=1',
    'phim-bo': 'https://ophim1.com/v1/api/danh-sach/phim-bo?page=1',
    'tv-shows': 'https://ophim1.com/v1/api/danh-sach/tv-shows?page=1',
    'hoat-hinh': 'https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1'
};

function loadMoviesByFilter() {
    showLoading();

    const endpoint = FILTER_ENDPOINTS[currentFilter] || FILTER_ENDPOINTS['all'];

    fetch(endpoint)
        .then(res => res.json())
        .then(data => {
            const movies = data?.data?.items || [];

            // Sắp xếp client-side (vì API không hỗ trợ sort)
            const sortedMovies = sortMovies(movies);

            // Render các section
            renderToGrids(sortedMovies);

            hideLoading();
        })
        .catch(err => {
            console.error('Lỗi tải phim theo filter:', err);
            hideLoading();
            document.querySelectorAll('.movie-grid').forEach(grid => {
                grid.innerHTML = '<p style="text-align:center;padding:3rem;">Lỗi tải dữ liệu</p>';
            });
        });
}

// Hàm sắp xếp (giữ nguyên)
function sortMovies(movies) {
    return [...movies].sort((a, b) => {
        switch (currentSort) {
            case 'latest':
                return new Date(b.modified?.time || 0) - new Date(a.modified?.time || 0);
            case 'year':
                return (b.year || 0) - (a.year || 0);
            case 'name':
                return (a.name || '').localeCompare(b.name || '', 'vi');
            default:
                return 0;
        }
    });
}

// Render chung cho các grid
function renderToGrids(movies) {
    const grids = [
        document.getElementById('featured-movies'),
        document.getElementById('new-movies'),
        document.getElementById('trending-movies')
    ];

    grids.forEach(container => {
        if (!container) return;
        container.innerHTML = '';

        if (movies.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;">Không có phim nào</div>';
            return;
        }

        movies.slice(0, 12).forEach(movie => {
            const div = document.createElement('div');
            div.className = 'movie';
            div.innerHTML = `
                <div class="movie-image-wrapper">
                    <img src="https://img.ophim.live/uploads/movies/${movie.poster_url || movie.thumb_url}" 
                         alt="${movie.name}"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/200x300'">
                    <div class="movie-overlay"><i class="fas fa-play-circle"></i></div>
                    <span class="movie-badge">${movie.quality || 'HD'}</span>
                </div>
                <div class="movie-info">
                    <h3>${movie.name}</h3>
                    <div class="movie-meta">
                        <span><i class="fas fa-star"></i> ${movie.episode_current || 'Full'}</span>
                        <span>${movie.year || 'N/A'}</span>
                    </div>
                </div>
            `;
            div.addEventListener('click', () => {
                window.location.href = `detail.html?slug=${movie.slug}`;
            });
            container.appendChild(div);
        });
    });
}

// Setup filter tabs
function setupQuickFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            currentFilter = this.dataset.filter || 'all';
            loadMoviesByFilter(); // Gọi API mới theo filter
        });
    });
}

// Setup sort
function setupSort() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            loadMoviesByFilter(); // Gọi lại API và sort mới
        });
    }
}
// ==================== CATEGORIES SECTION - CLICK TO FILTER PAGE ====================

function setupCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');

    categoryCards.forEach(card => {
        card.addEventListener('click', function () {
            const slug = this.getAttribute('data-category');

            if (!slug) {
                console.warn('Không tìm thấy data-category cho card này');
                return;
            }

            // Chuyển hướng đến trang lọc phim với tham số type=the-loai & slug
            const filterUrl = `phim-loc.html?type=the-loai&slug=${slug}`;

            // Optional: thêm loading effect hoặc confirm nếu cần
            // window.location.href = filterUrl;

            // Để mượt mà hơn, có thể thêm transition hoặc loading overlay
            document.body.style.cursor = 'wait';
            setTimeout(() => {
                window.location.href = filterUrl;
            }, 300);
        });

        // Hiệu ứng hover (tùy chọn, nếu chưa có trong CSS)
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.05)';
            card.style.boxShadow = '0 10px 25px rgba(229, 9, 20, 0.3)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'none';
        });
    });
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    setupCategoryCards();

    // Nếu bạn muốn load động danh sách thể loại từ API /v1/api/the-loai
    // và render card thay vì hard-code HTML (khuyến nghị nếu muốn chính xác hơn)
    // loadDynamicCategories();
});

// Optional: Load động các category từ API (thay vì hard-code trong HTML)
function loadDynamicCategories() {
    fetch('https://ophim1.com/v1/api/the-loai')
        .then(res => res.json())
        .then(data => {
            const items = data?.data?.items || [];
            if (items.length === 0) return;

            const grid = document.querySelector('.categories-grid');
            if (!grid) return;

            grid.innerHTML = ''; // Xóa các card hard-code

            // Chỉ lấy 8-10 thể loại phổ biến (hoặc tất cả)
            items.slice(0, 15).forEach(category => {
                const slug = category.slug;
                const name = category.name;

                // Map icon theo slug (có thể mở rộng)
                const iconMap = {
                    'hanh-dong': 'fa-fist-raised',
                    'hai-huoc': 'fa-laugh',
                    'tinh-cam': 'fa-heart',
                    'kinh-di': 'fa-ghost',
                    'phieu-luu': 'fa-hiking',
                    'vien-tuong': 'fa-dragon',
                    'tam-ly': 'fa-brain',
                    'hoat-hinh': 'fa-cat'
                };

                const iconClass = iconMap[slug] || 'fa-film';

                const card = document.createElement('div');
                card.className = 'category-card';
                card.setAttribute('data-category', slug);
                card.innerHTML = `
                    <i class="fas ${iconClass}"></i>
                    <h3>${name}</h3>
                `;
                grid.appendChild(card);
            });

            // Sau khi render xong, gắn lại sự kiện click
            setupCategoryCards();
        })
        .catch(err => {
            console.error('Lỗi tải danh sách thể loại:', err);
            // Giữ nguyên card hard-code nếu lỗi
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type")?.trim();
    const slug = params.get("slug")?.trim();
    const filterTitleEl = document.getElementById("filter-title");
    const movieGridEl = document.getElementById("movie-grid");
    const paginationEl = document.getElementById("filter-pagination");

    // Chỉ chạy logic này ở trang phim-loc
    if (!filterTitleEl || !movieGridEl || !paginationEl) return;

    if (!type) {
        filterTitleEl.textContent = "Không tìm thấy bộ lọc";
        movieGridEl.innerHTML =
            '<p style="text-align:center;padding:4rem;">Vui lòng chọn bộ lọc hợp lệ</p>';
        paginationEl.innerHTML = "";
        return;
    }

    let currentPage = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
    let totalPages = 1;

    function buildApiUrl(page) {
        if (!slug || slug === "all") {
            return `https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`;
        }

        switch (type) {
            case "the-loai":
                return `https://ophim1.com/v1/api/the-loai/${slug}?page=${page}`;
            case "quoc-gia":
                return `https://ophim1.com/v1/api/quoc-gia/${slug}?page=${page}`;
            case "nam-phat-hanh":
                return `https://ophim1.com/v1/api/nam-phat-hanh/${slug}?page=${page}`;
            default:
                return "";
        }
    }

    function buildTitle() {
        if (!slug || slug === "all") {
            if (type === "the-loai") return "Tất cả phim theo thể loại";
            if (type === "quoc-gia") return "Tất cả phim theo quốc gia";
            if (type === "nam-phat-hanh") return "Tất cả phim theo năm phát hành";
            return "";
        }

        if (type === "the-loai") return `Thể loại: ${slug.replace(/-/g, " ").toUpperCase()}`;
        if (type === "quoc-gia") return `Quốc gia: ${slug.replace(/-/g, " ").toUpperCase()}`;
        if (type === "nam-phat-hanh") return `Năm phát hành: ${slug}`;
        return "";
    }

    function extractTotalPages(data, movies) {
        const candidates = [
            data?.data?.params?.pagination?.totalPages,
            data?.data?.params?.pagination?.total_pages,
            data?.data?.params?.pagination?.totalPage,
            data?.data?.params?.pagination?.total_page
        ];
        for (const value of candidates) {
            const n = Number(value);
            if (Number.isFinite(n) && n > 0) return n;
        }

        const totalItems = Number(
            data?.data?.params?.pagination?.totalItems ??
            data?.data?.params?.pagination?.total_items
        );
        const perPage = Number(
            data?.data?.params?.pagination?.totalItemsPerPage ??
            data?.data?.params?.pagination?.items_per_page ??
            movies.length
        );
        if (Number.isFinite(totalItems) && totalItems > 0 && Number.isFinite(perPage) && perPage > 0) {
            return Math.max(1, Math.ceil(totalItems / perPage));
        }

        // Fallback: nếu không có metadata, chỉ cho next khi trang hiện tại có >= 24 items
        return movies.length >= 24 ? currentPage + 1 : currentPage;
    }

    function updatePageInUrl(page) {
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(page));
        history.replaceState({}, "", url);
    }

    function renderPagination() {
        if (totalPages <= 1) {
            paginationEl.innerHTML = "";
            return;
        }

        const prevDisabled = currentPage <= 1 ? "disabled" : "";
        const nextDisabled = currentPage >= totalPages ? "disabled" : "";

        paginationEl.innerHTML = `
            <button class="page-btn" data-page="${currentPage - 1}" ${prevDisabled}>Trước</button>
            <span class="page-indicator">Trang ${currentPage} / ${totalPages}</span>
            <button class="page-btn" data-page="${currentPage + 1}" ${nextDisabled}>Sau</button>
        `;

        paginationEl.querySelectorAll(".page-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (btn.disabled) return;
                const nextPage = Number(btn.dataset.page);
                if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > totalPages) return;
                loadFilteredPage(nextPage);
            });
        });
    }

    function loadFilteredPage(page) {
        const apiUrl = buildApiUrl(page);
        const title = buildTitle();

        if (!apiUrl || !title) {
            filterTitleEl.textContent = "Bộ lọc không hợp lệ";
            movieGridEl.innerHTML =
                '<p style="text-align:center;padding:4rem;">Không thể tải bộ lọc này</p>';
            paginationEl.innerHTML = "";
            return;
        }

        currentPage = page;
        filterTitleEl.innerHTML = `<i class="fas fa-filter"></i> ${title}`;
        paginationEl.innerHTML = "";
        showLoading();

        const loadingTimeout = setTimeout(() => {
            hideLoading();
            movieGridEl.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:4rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--primary-color);"></i>
                    <p>Quá thời gian chờ. Vui lòng thử lại sau.</p>
                </div>
            `;
        }, 10000);

        fetch(apiUrl)
            .then((res) => res.json())
            .then((data) => {
                clearTimeout(loadingTimeout);
                const movies = data?.data?.items || [];
                totalPages = Math.max(1, extractTotalPages(data, movies));
                if (currentPage > totalPages) currentPage = totalPages;
                renderMovies(movies);
                renderPagination();
                updatePageInUrl(currentPage);
                hideLoading();
            })
            .catch((err) => {
                clearTimeout(loadingTimeout);
                console.error("Lỗi tải phim:", err);
                movieGridEl.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:4rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--primary-color);"></i>
                        <p>Lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>
                    </div>
                `;
                paginationEl.innerHTML = "";
                hideLoading();
            });
    }

    loadFilteredPage(currentPage);
});

// Hàm render phim (tái sử dụng từ main.js của bạn)
function renderMovies(movies) {
    const container = document.getElementById("movie-grid");
    container.innerHTML = "";

    if (movies.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:4rem;">
                <i class="fas fa-film" style="font-size:4rem;color:var(--text-secondary);"></i>
                <p>Không tìm thấy phim nào trong bộ lọc này.</p>
            </div>
        `;
        return;
    }

    movies.forEach((movie) => {
        const div = document.createElement("div");
        div.className = "movie";

        const year = movie.year || "N/A";
        const quality = movie.quality || "HD";
        const episode = movie.episode_current || "Full";

        div.innerHTML = `
            <div class="movie-image-wrapper">
                <img src="https://img.ophim.live/uploads/movies/${movie.poster_url || movie.thumb_url}" 
                     alt="${movie.name}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                <div class="movie-overlay">
                    <i class="fas fa-play-circle"></i>
                </div>
                <span class="movie-badge">${quality}</span>
            </div>
            <div class="movie-info">
                <h3>${movie.name}</h3>
                <div class="movie-meta">
                    <span><i class="fas fa-star"></i> ${episode}</span>
                    <span>${year}</span>
                </div>
            </div>
        `;

        div.addEventListener("click", () => {
            window.location.href = `detail.html?slug=${movie.slug}`;
        });

        container.appendChild(div);
    });
}

// Khởi động
document.addEventListener('DOMContentLoaded', () => {
    initFooter();
    setupQuickFilters();
    setupSort();
    loadMoviesByFilter(); // Tải phim và áp dụng filter mặc định
    loadDynamicCategories(); // Tùy chọn: tải động category từ API
});
