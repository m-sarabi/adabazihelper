/**
 * Filters a list of strings based on a given part, supporting wildcards.
 *
 * @param {string[]} phrases - The list of strings to filter.
 * @param {string} part - The string to search for, possibly containing '*' as a wildcard.
 * @returns {string[]} A new list containing only the strings from `phrases` that match `part`.
 */
function filterStringsWithWildcard(phrases, part) {
    const result = [];

    // Handle the case where part is empty
    if (!part) {
        return phrases; // Or return [], depending on the desired behavior.  Returning all phrases seems more consistent with the description.
    }

    const regexPattern = partToRegex(part); // Convert the part string to a RegExp pattern

    for (const phrase of phrases) {
        if (regexPattern.test(phrase)) {
            result.push(phrase);
        }
    }
    return result;
}

/**
 * Converts a wildcard string to a RegExp pattern.
 *
 * @param {string} part - The string to convert, possibly containing '*' as a wildcard.
 * @returns {RegExp} A RegExp object representing the wildcard pattern.
 */
function partToRegex(part) {
    // Escape special regex characters in the 'part' string, except for '*'
    const escapedPart = part.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

    // Add ^ and $ to match the whole string, unless the part starts/ends with a wildcard
    let regexPatternString = escapedPart;

    // Add '*' to the start and end of the pattern if it doesn't already contain it
    if (escapedPart.indexOf('*') === -1) {
        regexPatternString = '.*' + escapedPart + '.*';
    }

    if (!escapedPart.startsWith('.*')) {
        regexPatternString = '^' + regexPatternString;
    }
    if (!escapedPart.endsWith('.*')) {
        regexPatternString = regexPatternString + '$';
    }
    return new RegExp(regexPatternString, 'i'); // 'i' for case-insensitive matching
}


/**
 * Convert Persian numbers to English numbers
 *
 * @param {string} originalString - The string to convert
 * @returns {string} The converted string
 */
function persianToEnglish(originalString) {
    if (typeof originalString !== 'string') {
        return originalString; // Return as is if not a string
    }

    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';

    let result = '';
    for (let i = 0; i < originalString.length; i++) {
        const char = originalString[i];
        const persianIndex = persianDigits.indexOf(char);
        if (persianIndex !== -1) {
            result += englishDigits[persianIndex];
        } else {
            result += char; // Keep non-Persian characters as they are
        }
    }
    return result;
}


document.addEventListener('DOMContentLoaded', async () => {
    const categories = [
        'اشیاء',
        'عمومی',
        'فیلم و سریال',
        'مشاهیر',
        'اماکن و گردشگری',
        'ورزشی',
        'تکنولوژی و علمی',
        'خوراکی',
        'جانوران',
        'شغل',
        'کتاب',
        'تاریخ',
        'ضرب المثل',
        'انتزاعی',
        'شهر و کشور',
        'موسیقی',
        'کودکان',
        'کارتون',
        'سلبریتی',
        'فوتبال',
    ];
    const categoriesList = document.getElementById('categories-list');
    const searchBar = document.getElementById('search-bar');
    const resultsDiv = document.getElementById('results');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementsByClassName('sidebar-toggle')[0];

    const pointButtons = document.querySelectorAll('.points button');

    const data = await jsonToMap('./assets/adabazi_words.json');

    // Function to search results
    function performSearch(point, categoryIndex, searchText) {
        // const category = categories[categoryIndex];
        const phrases = data[point.toString().padStart(2, '0') + 'p'][(Number(categoryIndex) + 1).toString().padStart(2, '0')];
        return filterStringsWithWildcard(phrases, searchText);
    }

    // Function to display results
    function displayResults(results) {
        resultsDiv.innerHTML = '';
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.textContent = result;
            resultsDiv.appendChild(resultItem);
        });
    }

    // Populate categories list
    categories.forEach((category, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = category;
        listItem.addEventListener('click', () => {
            document.querySelectorAll('.sidebar li').forEach(item => {
                item.classList.remove('active');
            });
            listItem.classList.add('active');
            searchBar.dataset.categoryIndex = index;
            if (window.innerWidth < 768) {
                sidebar.classList.add('collapsed');
            }
            searchBar.dispatchEvent(new Event('input'));// trigger search on category change.
        });
        categoriesList.appendChild(listItem);
    });

    // activate the first category
    document.querySelectorAll('.sidebar li')[0].classList.add('active');

    // Search bar event listener
    searchBar.addEventListener('input', () => {
        const searchText = persianToEnglish(searchBar.value);
        const categoryIndex = searchBar.dataset.categoryIndex || 0;
        const point = searchBar.dataset.point || 3;
        const results = performSearch(point, categoryIndex, searchText);
        const countElement = document.querySelector('.count');
        countElement.textContent = results.length.toString();
        displayResults(results);
    });

    searchBar.dataset.categoryIndex = '0'; //Default load category 0 on initial load.
    searchBar.dispatchEvent(new Event('input')); // trigger search on initial load.

    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('collapsed');
    }

    // Add media query check to ensure sidebar is visible on desktop.
    function setupSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebarToggle.style.display = window.innerWidth > 768 ? 'none' : 'block';
        if (window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
        } else {
            sidebar.classList.add('collapsed');
        }
    }

    // Run setup on page load and resize.
    setupSidebar();
    window.addEventListener('resize', setupSidebar);

    sidebarToggle.addEventListener('click', toggleSidebar);

    pointButtons.forEach(button => {
        button.addEventListener('click', () => {
            // enable other buttons and disable the clicked button
            pointButtons.forEach(btn => {
                btn.disabled = false;
            });
            button.disabled = true;
            searchBar.dataset.point = button.dataset.points;
            searchBar.dispatchEvent(new Event('input'));
        });
    });

    async function jsonToMap(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            return JSON.parse(JSON.stringify(jsonData));
        } catch (error) {
            console.error('Error reading JSON:', error);
            return null; // or throw an error, depending on how you want to handle errors.
        }
    }
});
