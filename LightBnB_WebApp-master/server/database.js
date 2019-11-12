const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = `
    SELECT * FROM users
    WHERE email = $1;
  `; 
  return pool.query(query, [email])
  .then(res => {
    if (res.rows) {
      return res.rows[0];
    } else {
      return null;
    }
  });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = `
    SELECT * FROM users
    WHERE id = $1;
  `; 
  return pool.query(query, [id])
  .then(res => {
    if (res.rows) {
      return res.rows[0];
    } else {
      return null;
    }
  });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const userInfo = [user.name, user.email, user.password];
  return pool.query(query, userInfo)
  .then(res => {
    if (res.rows) {
      return res.rows[0];
    } else {
      return null;
    }
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const query = `
    SELECT properties.*, reservations.*, AVG(property_reviews.rating) as average_rating
      FROM properties
      JOIN reservations ON properties.id = reservations.property_id
      JOIN property_reviews ON properties.id = property_reviews.property_id  
      WHERE end_date < now()::date AND reservations.guest_id = $1
      GROUP BY properties.id, reservations.id
      ORDER BY start_date
    LIMIT $2;
  `;
  const values = [guest_id, limit];
  return pool.query(query, values)
  .then (res => {
    if (res.rows) {
      return res.rows;
    } else {
      return null;
    }
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (queryParams.length > 1) {
			queryString += `AND city LIKE $${queryParams.length} `;
		} else {
			queryString += `WHERE city LIKE $${queryParams.length} `;
		}
  }

  if (options.owner_id) {
		queryParams.push(options.owner_id);
		if (queryParams.length > 1) {
			queryString += `AND owner_id = $${queryParams.length} `;
		} else {
			queryString += `WHERE owner_id = $${queryParams.length} `;
		}
  }
  
  if (options.min_price_per_night && options.max_price_per_night) {
    // multiply by 100 due to unit being in cents (always save currency as integer not float!!!)
    queryParams.push(options.min_price_pernight * 100);
    queryParams.push(options.max_price_per_night * 100);
    if (queryParams.length > 1) {
      queryString += `AND cost_per_night <= $${queryParams.length} AND cost_per_night >= $${queryParams.length - 1} `;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length} AND cost_per_night >= $${queryParams.length - 1} `;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);    
    queryString += `GROUP BY properties.id HAVING AVG(property_reviews.rating) >= $${queryParams.length} ORDER BY cost_per_night `;
  } else {
    queryString += `GROUP BY properties.id ORDER BY cost_per_night `
  }

  queryParams.push(limit);  
  queryString += `LIMIT $${queryParams.length};`; 

  return pool.query(queryString, queryParams)
  .then(res => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
