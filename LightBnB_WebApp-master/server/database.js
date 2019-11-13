const properties = require('./json/properties.json');
const users = require('./json/users.json');

const db = require('./db');

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
  return db.query(query, [email])
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
  return db.query(query, [id])
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
  return db.query(query, userInfo)
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
  return db.query(query, values)
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
  FULL OUTER JOIN property_reviews ON properties.id = property_id
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
		queryParams.push(parseInt(options.owner_id));
		if (queryParams.length > 1) {
			queryString += `AND owner_id = $${queryParams.length} `;
		} else {
			queryString += `WHERE owner_id = $${queryParams.length} `;
		}
  }
  
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    // multiply by 100 due to unit being in cents (always save currency as integer not float!!!)       
    queryParams.push(parseInt(options.minimum_price_per_night) * 100);
    queryParams.push(parseInt(options.maximum_price_per_night) * 100);   
    if (queryParams.length > 2) {
      queryString += `AND cost_per_night <= $${queryParams.length} AND cost_per_night >= $${queryParams.length - 1} `;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length} AND cost_per_night >= $${queryParams.length - 1} `;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(parseInt(options.minimum_rating));    
    queryString += `GROUP BY properties.id HAVING AVG(property_reviews.rating) >= $${queryParams.length} ORDER BY cost_per_night `;
  } else {
    queryString += `GROUP BY properties.id ORDER BY cost_per_night `
  }

  queryParams.push(limit);  
  queryString += `LIMIT $${queryParams.length};`;  
  return db.query(queryString, queryParams)
  .then(res => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {  
  const queryString = `
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;
  const propertyValues = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, 100 * property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];
  return db.query(queryString, propertyValues)
  .then(res => {
    if (res.rows) {
      return res.rows[0];
    } else {
      return null;
    }
  });
}
exports.addProperty = addProperty;
