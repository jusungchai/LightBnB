$(() => {

  const $reservationForm = $(`
  <form  id="reservation-form" class="reservation-form">

    <h2>Reservation</h2>

    <div class="reservation-date__field-wrapper">
      <label for="start-date">Start Date</label>     
      <input type="date" name="start_date" id="start-date">

      <label for="end-date">End Date</label>
      <input type="date" name="end_date" id="end-date">
    </div>

    <div class="reserve-form__field-wrapper">
        <button>RESERVE</button>
        <a id="reserve-form__cancel" href="#">Cancel</a>
    </div>

  </form>
  `);
  window.$reservationForm = $reservationForm;
  //console.log(window.$reservationForm)
  $reservationForm.on('submit', function(event) {    
    event.preventDefault();
    console.log(window.$reservationForm.propertyId);
    const data = $(this).serialize() + `&property_id=${window.$reservationForm.propertyId}`;
    propertyReservation(data)
    .then(() => {
      views_manager.show('listings');
      alert("RESERVE SUCCESS!");
    });

    /* getAllListings(data).then(function( json ) {
      propertyListings.addProperties(json.properties);
      views_manager.show('listings');
    }); */
  }); 

  $('body').on('click', '#reserve-form__cancel', function() {
    //console.log(window.$reservationForm)
    views_manager.show('listings');

    return false;
  });

  /* $reserveForm.on('submit', function(event) {
    event.preventDefault();
    const data = $(this).serialize();

    getAllListings(data).then(function( json ) {
      propertyListings.addProperties(json.properties);
      views_manager.show('listings');
    });
  });

  $('body').on('click', '#search-property-form__cancel', function() {
    views_manager.show('listings');
    return false;
  }); */

});