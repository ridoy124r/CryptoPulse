// Configuration
const CRYPTO_NEWS_API = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=4&page=1&sparkline=false&price_change_percentage=24h';

// Cache for API data
let newsCache = [];
let coinsCache = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchCryptoNews();
    fetchTrendingCoins();
    setupMobileMenu();
});

// Fetch cryptocurrency news
async function fetchCryptoNews() {
    const newsContainer = document.querySelector('.grid.md\\:grid-cols-3');
    
    // Show loading state
    showLoading(newsContainer);
    
    try {
        const response = await fetch(CRYPTO_NEWS_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        // CryptoCompare returns data in data.Data
        newsCache = data.Data || [];
        
        if (newsCache.length === 0) {
            throw new Error('No articles found');
        }
        
        displayNews(newsCache.slice(0, 6)); // Display first 6 news items
        
    } catch (error) {
        console.error('Error fetching crypto news:', error);
        showError(newsContainer, `Unable to load news: ${error.message}`);
    }
}

// Display news articles
function displayNews(articles) {
    const newsContainer = document.querySelector('.grid.md\\:grid-cols-3');
    
    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = '<p class="text-gray-400 col-span-3">No news available at the moment.</p>';
        return;
    }
    
    newsContainer.innerHTML = articles.map(article => {
        const imageUrl = article.imageurl || article.image_url || article.thumbnail || 'https://images.unsplash.com/photo-1621416878681-5a6cdbd8a5cc?auto=format&fit=crop&w=800&q=80';
        const title = article.title || 'Untitled';
        const description = article.body || article.description || article.content || 'No description available.';
        const url = article.url || article.guid || article.link || '#';
        const date = article.published_on ? article.published_on * 1000 : (article.publishedAt || article.createdAt);
        
        // Truncate description properly
        const truncatedDesc = description.length > 120 ? description.slice(0, 120) + '...' : description;
        
        return `
            <article class="bg-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-yellow-400/20 transition transform hover:-translate-y-1 flex flex-col h-full">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1621416878681-5a6cdbd8a5cc?auto=format&fit=crop&w=800&q=80'" />
                <div class="p-5 flex flex-col flex-grow">
                    <h4 class="text-xl font-semibold mb-2 line-clamp-2">
                        ${title}
                    </h4>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-3 flex-grow">
                        ${truncatedDesc}
                    </p>
                    <div class="flex items-center justify-between mt-auto">
                        <a href="${url}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="text-yellow-400 font-medium hover:underline">
                            Read More →
                        </a>
                        <span class="text-xs text-gray-500">
                            ${formatDate(date)}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Fetch trending coins data
async function fetchTrendingCoins() {
    const coinsContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
    
    try {
        const response = await fetch(COINGECKO_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const coins = await response.json();
        coinsCache = coins;
        
        displayCoins(coins);
        
    } catch (error) {
        console.error('Error fetching trending coins:', error);
        // Keep the static data if API fails
    }
}

// Display trending coins
function displayCoins(coins) {
    const coinsContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
    
    if (!coins || coins.length === 0) return;
    
    coinsContainer.innerHTML = coins.map(coin => {
        const priceChange = coin.price_change_percentage_24h || 0;
        const isPositive = priceChange >= 0;
        
        return `
            <div class="bg-gray-800 p-5 rounded-2xl hover:shadow-lg hover:shadow-yellow-400/20 transition transform hover:-translate-y-1 cursor-pointer">
                <div class="flex items-center gap-2 mb-2">
                    <img src="${coin.image}" alt="${coin.name}" class="w-8 h-8" />
                    <h4 class="text-lg font-semibold">${coin.name} (${coin.symbol.toUpperCase()})</h4>
                </div>
                <p class="text-gray-400">Price: $${formatPrice(coin.current_price)}</p>
                <p class="${isPositive ? 'text-green-400' : 'text-red-400'}">
                    ${isPositive ? '+' : ''}${priceChange.toFixed(2)}%
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    Cap: $${formatLargeNumber(coin.market_cap)}
                </p>
            </div>
        `;
    }).join('');
}

// Utility function to format price
function formatPrice(price) {
    if (price >= 1) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

// Utility function to format large numbers
function formatLargeNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
}

// Utility function to format date
function formatDate(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Show loading state
function showLoading(container) {
    container.innerHTML = `
        <div class="col-span-3 flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
    `;
}

// Show error message
function showError(container, message) {
    container.innerHTML = `
        <div class="col-span-3 bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p class="text-red-400">${message}</p>
            <button onclick="fetchCryptoNews()" class="mt-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition">
                Retry
            </button>
        </div>
    `;
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const menuButton = document.querySelector('button.md\\:hidden');
    const nav = document.querySelector('nav.hidden.md\\:flex');
    
    if (menuButton && nav) {
        menuButton.addEventListener('click', () => {
            nav.classList.toggle('hidden');
            nav.classList.toggle('flex');
            nav.classList.toggle('flex-col');
            nav.classList.toggle('absolute');
            nav.classList.toggle('top-full');
            nav.classList.toggle('left-0');
            nav.classList.toggle('right-0');
            nav.classList.toggle('bg-gray-900');
            nav.classList.toggle('p-6');
            nav.classList.toggle('space-x-0');
            nav.classList.toggle('space-y-4');
        });
    }
}

// Auto-refresh news every 5 minutes
setInterval(() => {
    fetchCryptoNews();
    fetchTrendingCoins();
}, 5 * 60 * 1000);