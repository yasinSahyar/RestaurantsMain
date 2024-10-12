import { errorModal, restaurantModal, restaurantRow } from '../components';
import { fetchData } from '../functions';
import { apiUrl } from '../variables';
import * as L from 'leaflet';
// DOM elements
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const signUpDialog = document.getElementById('signUpDialog');
const signUpForm = document.getElementById('signUpForm');
const logInDialog = document.getElementById('logInDialog');
const signInForm = document.getElementById('signInForm');
const modal = document.querySelector('dialog');
if (!modal)
    throw new Error('Modal not found');
// Setup SignUp and SignIn Buttons
signUpButton.addEventListener('click', () => signUpDialog.showModal());
signInButton.addEventListener('click', () => logInDialog.showModal());
document.getElementById('closeSignUp')?.addEventListener('click', () => signUpDialog.close());
document.getElementById('closeSignIn')?.addEventListener('click', () => logInDialog.close());
// SignUp Form submission
signUpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(signUpForm);
    const userDetails = Object.fromEntries(formData.entries());
    console.log('Sign Up Details:', userDetails);
    signUpDialog.close();
});
// SignIn Form submission and authentication
signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('logInUsername').value;
    const password = document.getElementById('logInPassword').value;
    try {
        const loginResult = await login(username, password);
        localStorage.setItem('token', loginResult.token);
        logInDialog.close();
    }
    catch (error) {
        alert('Invalid username or password. Please try again.');
    }
});
// Login function
const login = async (username, password) => {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    };
    return await fetchData(`${apiUrl}/auth/login`, options);
};
// Initialize the map and fetch restaurants
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
    }).addTo(map);
    const markerIcon = L.icon({
        iconUrl: 'icons/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowUrl: 'icons/marker-shadow.png',
        shadowSize: [41, 41],
    });
    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', async (e) => {
        const radius = e.accuracy / 2;
        L.marker(e.latlng, { icon: markerIcon })
            .addTo(map)
            .bindPopup(`You are within ${radius} meters from this point`)
            .openPopup();
        L.circle(e.latlng, radius).addTo(map);
        await fetchAndDisplayRestaurants(e.latlng.lat, e.latlng.lng);
    });
    map.on('locationerror', (e) => alert(e.message));
});
// Fetch and display restaurants
async function fetchAndDisplayRestaurants(lat, lng) {
    try {
        const restaurants = await fetchData(`${apiUrl}/restaurants`);
        restaurants.sort((a, b) => calculateDistance(lat, lng, a.location.coordinates[1], a.location.coordinates[0])
            - calculateDistance(lat, lng, b.location.coordinates[1], b.location.coordinates[0]));
        createTable(restaurants);
        setupFilterButtons(restaurants);
    }
    catch (error) {
        showErrorModal(error.message);
    }
}
// Utility to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);
// Create table of restaurants
const createTable = (restaurants) => {
    const table = document.querySelector('table');
    if (!table)
        return console.log('Table is missing in HTML');
    table.innerHTML = '';
    restaurants.forEach((restaurant) => {
        const tr = restaurantRow(restaurant);
        table.appendChild(tr);
        tr.addEventListener('click', () => handleRestaurantClick(restaurant));
    });
};
// Handle restaurant click to show daily and weekly menus
const handleRestaurantClick = async (restaurant) => {
    try {
        document.querySelectorAll('.highlight').forEach((elem) => elem.classList.remove('highlight'));
        const tr = document.querySelector(`[data-id="${restaurant._id}"]`);
        if (tr)
            tr.classList.add('highlight');
        modal.innerHTML = '';
        const dailyMenu = await fetchData(`${apiUrl}/restaurants/daily/${restaurant._id}/fi`);
        modal.insertAdjacentHTML('beforeend', restaurantModal(restaurant, dailyMenu));
        modal.showModal();
        const dailyMenuButton = document.createElement('button');
        dailyMenuButton.textContent = 'Show Daily Menu';
        dailyMenuButton.addEventListener('click', async () => {
            const dailyMenuData = await fetchData(`${apiUrl}/restaurants/daily/${restaurant._id}/fi`);
            modal.innerHTML = restaurantModal(restaurant, dailyMenuData);
        });
        const weeklyMenuButton = document.createElement('button');
        weeklyMenuButton.textContent = 'Show Weekly Menu';
        weeklyMenuButton.addEventListener('click', async () => {
            const weeklyMenuData = await fetchData(`${apiUrl}/restaurants/weekly/${restaurant._id}/fi`);
            modal.innerHTML = generateWeeklyMenuHtml(weeklyMenuData);
        });
        modal.appendChild(dailyMenuButton);
        modal.appendChild(weeklyMenuButton);
    }
    catch (error) {
        showErrorModal(error.message);
    }
};
// Generate weekly menu HTML
const generateWeeklyMenuHtml = (weeklyMenu) => {
    return `
        <h2>Weekly Menu</h2>
        ${weeklyMenu.days.map(day => `
            <h3>${day.date}</h3>
            <ul>
                ${day.courses.map(course => `<li>${course.name} - ${course.price} (${course.diets.join(', ')})</li>`).join('')}
            </ul>
        `).join('')}
    `;
};
// Setup filtering buttons
const setupFilterButtons = (restaurants) => {
    const sodexoBtn = document.getElementById('sodexo');
    const compassBtn = document.getElementById('compass');
    const resetBtn = document.getElementById('reset');
    sodexoBtn?.addEventListener('click', () => {
        const sodexoRestaurants = restaurants.filter(restaurant => restaurant.company === 'Sodexo');
        createTable(sodexoRestaurants);
    });
    compassBtn?.addEventListener('click', () => {
        const compassRestaurants = restaurants.filter(restaurant => restaurant.company === 'Compass Group');
        createTable(compassRestaurants);
    });
    resetBtn?.addEventListener('click', () => createTable(restaurants));
};
// Display error modal
const showErrorModal = (message) => {
    modal.innerHTML = errorModal(message);
    modal.showModal();
};
