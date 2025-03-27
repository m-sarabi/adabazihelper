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

// // Example usage:
// const phrases = ['carwash', 'keycard', 'oscar', 'car', 'caravan', 'unearth', 'unarmed', 'carmaker', 'supercar', 'a car is here'];
//
// console.log('car', filterStringsWithWildcard(phrases, 'car'));       // Output: ['carwash', 'keycard', 'oscar', 'car', 'caravan', 'carmaker', 'supercar', 'a car is here']
// console.log('*car', filterStringsWithWildcard(phrases, '*car'));      // Output: ['oscar', 'car', 'supercar']
// console.log('car*', filterStringsWithWildcard(phrases, 'car*'));      // Output: ['carwash', 'caravan', 'car', 'carmaker']
// console.log('un*ar*', filterStringsWithWildcard(phrases, 'un*ar*'));    // Output: ['unearth', 'unarmed']
// console.log('*ar*is*', filterStringsWithWildcard(phrases, 'a car is here')); // Output: ['a car is here']
// console.log('nonexistent', filterStringsWithWildcard(phrases, 'nonexistent'));  // Output: []
// console.log('empty', filterStringsWithWildcard(phrases, ''));  // Output: []


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

    const data = await jsonToMap('adabazi_words.json')

    // Function to search results
    function performSearch(categoryIndex, searchText) {
        // const category = categories[categoryIndex];
        const phrases = data.get((Number(categoryIndex) + 1).toString().padStart(2, '0'));
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
            searchBar.dataset.categoryIndex = index;
            if (window.innerWidth < 768) {
                sidebar.classList.add('collapsed');
            }
            searchBar.dispatchEvent(new Event('input'));// trigger search on category change.
        });
        categoriesList.appendChild(listItem);
    });

    // Search bar event listener
    searchBar.addEventListener('input', () => {
        const searchText = searchBar.value;
        const categoryIndex = searchBar.dataset.categoryIndex || 0;
        const results = performSearch(categoryIndex, searchText);
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

    async function jsonToMap(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            const resultMap = new Map();

            for (const key in jsonData) {
                if (jsonData.hasOwnProperty(key)) {
                    if (Array.isArray(jsonData[key]) && jsonData[key].every(item => typeof item === 'string')) {
                        resultMap.set(key, jsonData[key]);
                    } else {
                        console.error(`Invalid data format for key "${key}". Expected an array of strings.`);
                        return null; // or throw an error, depending on how you want to handle invalid data.
                    }
                }
            }

            return resultMap;
        } catch (error) {
            console.error('Error reading JSON:', error);
            return null; // or throw an error, depending on how you want to handle errors.
        }
    }
});
