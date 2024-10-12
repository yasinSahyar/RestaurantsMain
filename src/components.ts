import { DailyMenu, WeeklyMenu } from "./interfaces/Menu"; // Import WeeklyMenu interface
import { Restaurant } from "./interfaces/Restaurant";

const restaurantRow = (restaurant: Restaurant) => {
  const { name, address, company } = restaurant;
  const tr = document.createElement('tr');
  const nameCell = document.createElement('td');
  nameCell.innerText = name;
  const addressCell = document.createElement('td');
  addressCell.innerText = address;
  const companyCell = document.createElement('td');
  companyCell.innerText = company;
  tr.appendChild(nameCell);
  tr.appendChild(addressCell);
  tr.appendChild(companyCell);
  return tr;
};

const restaurantModal = (restaurant: Restaurant, menu: DailyMenu | WeeklyMenu) => {
  const { name, address, city, postalCode, phone, company } = restaurant;
  let html = `<h3>${name}</h3>
    <p>${company}</p>
    <p>${address} ${postalCode} ${city}</p>
    <p>${phone}</p>
    
    <table>
      <tr>
        <th>Course</th>
        <th>Diet</th>
        <th>Price</th>
      </tr>
  `;

  // Check if it's a DailyMenu or WeeklyMenu and populate accordingly
  if ('courses' in menu) {
    // Handle Daily Menu
    menu.courses.forEach((course) => {
      const { name, diets, price } = course;
      html += `
        <tr>
          <td>${name}</td>
          <td>${diets ?? ' - '}</td>
          <td>${price ?? ' - '}€</td>
        </tr>
      `;
    });
  } else if ('days' in menu) {
    // Handle Weekly Menu
    menu.days.forEach((day) => {
      html += `<tr><td colspan="3"><strong>${day.date}</strong></td></tr>`;
      day.courses.forEach((course) => {
        const { name, diets, price } = course;
        html += `
          <tr>
            <td>${name}</td>
            <td>${diets ?? ' - '}</td>
            <td>${price ?? ' - '}€</td>
          </tr>
        `;
      });
    });
  }

  html += '</table>';
  return html;
};

const errorModal = (message: string) => {
  const html = `
    <h3>Error</h3>
    <p>${message}</p>
  `;
  return html;
};

export { restaurantRow, restaurantModal, errorModal };
