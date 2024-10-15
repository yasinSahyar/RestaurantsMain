import { errorModal, restaurantModal, restaurantRow } from './components';
import { fetchData } from './functions';
import { DailyMenu } from './interfaces/Menu';
import { Restaurant } from './interfaces/Restaurant';
import { LoginUser } from './interfaces/User';
import { apiUrl } from './variables';
import * as L from 'leaflet';
import { WeeklyMenu } from './interfaces/Menu'; 


// Get elements from the DOM
const signUpButton = document.getElementById('signUp') as HTMLButtonElement;
const signInButton = document.getElementById('signIn') as HTMLButtonElement;

// Sign Up Dialog Elements
const signUpDialog = document.getElementById('signUpDialog') as HTMLDialogElement;
const signUpForm = document.getElementById('signUpForm') as HTMLFormElement;
const closeSignUpButton = document.getElementById('closeSignUp') as HTMLButtonElement;

// Log In Dialog Elements
const logInDialog = document.getElementById('logInDialog') as HTMLDialogElement;
const signInForm = document.getElementById('signInForm') as HTMLFormElement;
const closeSignInButton = document.getElementById('closeSignIn') as HTMLButtonElement;

// Modal for displaying restaurant info
const modal = document.querySelector('dialog');
if (!modal) {
    throw new Error('Modal not found');
}
modal.addEventListener('click', () => {
    modal.close();
});

// Authentication Logic
if (closeSignInButton) {
    closeSignInButton.addEventListener('click', () => {
        logInDialog.close();
    });
}

// Function to set up the sign-up button event
const setupSignUpButton = () => {
    signUpButton.addEventListener('click', () => {
        signUpDialog.showModal();
    });
};

// Function to set up the sign-up form event
const setupSignUpForm = () => {
    // Handle the sign-up form submission
    signUpForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the default form submission

        const firstname = (document.getElementById('firstname') as HTMLInputElement).value;
        const familyname = (document.getElementById('familyname') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const phone = (document.getElementById('phone') as HTMLInputElement).value;
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        console.log('Sign Up Details:', { firstname, familyname, email, phone, username, password });

        // Close the sign-up dialog after submission
        signUpDialog.close();
    });
};

// Set up event listeners
setupSignUpButton();
setupSignUpForm();

if (closeSignUpButton) {
    closeSignUpButton.addEventListener('click', () => {
        signUpDialog.close();
    });
}

// Handle the sign-in button click
signInButton.addEventListener('click', () => {
    logInDialog.showModal();
});

// Function to login
const login = async (username: string, password: string): Promise<LoginUser> => {
    const data = { username, password };
    const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    };

    const result = await fetchData<LoginUser>(`${apiUrl}/auth/login`, options);
    return result;
};

// Handle the log-in form submission
signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const logInUsername = (document.getElementById('logInUsername') as HTMLInputElement).value;
    const logInPassword = (document.getElementById('logInPassword') as HTMLInputElement).value;

    // Attempt to log in
    try {
        const loginResult = await login(logInUsername, logInPassword);
        console.log('Log In Successful:', loginResult);
        localStorage.setItem('token', loginResult.token); // Store the token
        logInDialog.close(); // Close the dialog after successful login
    } catch (error) {
        console.error('Login Failed:', (error as Error).message);
        alert('Invalid username or password. Please try again.'); // Show error to user
    }
});

// Initialize the map and restaurant functionality
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

        const { lat, lng } = e.latlng;
        await fetchAndDisplayRestaurants(lat, lng);
    });

    map.on('locationerror', (e) => {
        alert(e.message);
    });
});

// Fetch and display restaurants near the user's location
async function fetchAndDisplayRestaurants(latitude: number, longitude: number) {
    try {
        const restaurants = await fetchData<Restaurant[]>(`${apiUrl}/restaurants`);
        restaurants.sort((a, b) => {
            const distanceA = calculateDistance(latitude, longitude, a.location.coordinates[1], a.location.coordinates[0]);
            const distanceB = calculateDistance(latitude, longitude, b.location.coordinates[1], b.location.coordinates[0]);
            return distanceA - distanceB;
        });
        createTable(restaurants);
        setupFilterButtons(restaurants); // Set up filtering buttons after fetching restaurants
    } catch (error) {
        if (modal) {
            modal.innerHTML = errorModal((error as Error).message);
            modal.showModal();
        } else {
            console.error('Modal is null');
        }
    }
}

// Utility functions
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) =>
    Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);
const createTable = (restaurants: Restaurant[]) => {
    const table = document.querySelector('table');
    if (!table) {
        console.log('Table is missing in HTML');
        return;
    }
    table.innerHTML = '';
    restaurants.forEach((restaurant) => {
        const tr = restaurantRow(restaurant);
        table.appendChild(tr);

        // Add click listener for row highlighting and showing restaurant details
        tr.addEventListener('click', () => {
            document.querySelectorAll('.highlight').forEach((elem) => elem.classList.remove('highlight'));
            tr.classList.add('highlight');
        });

        // Create a container for the menu buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'menu-buttons';

        // Daily Menu Button
        const dailyMenuButton = document.createElement('button');
        dailyMenuButton.textContent = 'Daily Menu';
        dailyMenuButton.addEventListener('click', async () => {
            try {
                modal.innerHTML = ''; // Clear modal content
                const dailyMenu = await fetchData<DailyMenu>(`${apiUrl}/restaurants/daily/${restaurant._id}/fi`);
                modal.insertAdjacentHTML('beforeend', restaurantModal(restaurant, dailyMenu));
                modal.showModal(); // Show the modal with daily menu
            } catch (error) {
                if (modal) {
                    modal.innerHTML = errorModal((error as Error).message);
                    modal.showModal();
                } else {
                    console.error('Modal is null');
                }
            }
        });

        // Weekly Menu Button
        const weeklyMenuButton = document.createElement('button');
        weeklyMenuButton.textContent = 'Weekly Menu';
        weeklyMenuButton.addEventListener('click', async () => {
            try {
                modal.innerHTML = ''; // Clear modal content
                const weeklyMenu = await fetchData<WeeklyMenu>(`${apiUrl}/restaurants/weekly/${restaurant._id}/fi`);
                modal.insertAdjacentHTML('beforeend', restaurantModal(restaurant, weeklyMenu));
                modal.showModal(); // Show the modal with weekly menu
            } catch (error) {
                if (modal) {
                    modal.innerHTML = errorModal((error as Error).message);
                    modal.showModal();
                } else {
                    console.error('Modal is null');
                }
            }
        });

        // Add buttons to the container and append to the table row
        buttonContainer.appendChild(dailyMenuButton);
        buttonContainer.appendChild(weeklyMenuButton);
        tr.appendChild(buttonContainer);
    });
};


// Set up filtering buttons
const setupFilterButtons = (restaurants: Restaurant[]) => {
    const sodexoBtn = document.querySelector('#sodexo') as HTMLButtonElement;
    const compassBtn = document.querySelector('#compass') as HTMLButtonElement;
    const resetBtn = document.querySelector('#reset') as HTMLButtonElement;

    if (!sodexoBtn) {
        console.log('Sodexo button is missing in HTML');
        return;
    }
    if (!compassBtn) {
        console.log('Compass button is missing in HTML');
        return;
    }
    if (!resetBtn) {
        console.log('Reset button is missing in HTML');
        return;
    }

    sodexoBtn.addEventListener('click', () => {
        const sodexoRestaurants = restaurants.filter(restaurant => restaurant.company === 'Sodexo');
        createTable(sodexoRestaurants);
    });

    compassBtn.addEventListener('click', () => {
        const compassRestaurants = restaurants.filter(restaurant => restaurant.company === 'Compass Group');
        createTable(compassRestaurants);
    });

    resetBtn.addEventListener('click', () => {
        createTable(restaurants); // Reset to show all restaurants
    });
};
