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

  return pool.query(`
  SELECT * FROM properties
  LIMIT $1
  `, [limit])
  .then(res => res.rows);

  /* const limitedProperties = {};
  for (let i = 1; i <= limit; i++) {
    limitedProperties[i] = properties[i];
  }
  return Promise.resolve(limitedProperties); */
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
