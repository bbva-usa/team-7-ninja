/* eslint-disable no-alert */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html } from 'lit-element';
import { PageViewElement } from './page-view-element.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

const directionsService = new google.maps.DirectionsService();

let map;

class HomeView extends PageViewElement {
  static get styles() {
    return [
      SharedStyles
    ];
  }

  static get properties() {
    return {
      route: { type: Array },
    };
  }

  constructor() {
    super();
    this.route = {};
  }

  firstUpdated() {
    map = new google.maps.Map(this.shadowRoot.querySelector('#map'), {
      center: { lat: 33.4757032, lng: -86.94038 },
      zoom: 13,
    });
    const infoWindow = new google.maps.InfoWindow();

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
  
        infoWindow.setPosition(pos);
        infoWindow.setContent('Location found.');
        infoWindow.open(map);
        console.log(pos);
        map.setCenter(pos);
      }, () => {
        console.error('Error Getting Lcation');
      });
    } else {
      console.log('errororo');
    }
  }

  updated(changedProperties) {
    if (!changedProperties.has('route')) return;

    this._calculateRoutes('pick_up');
    this._calculateRoutes('drop_off');
  }

  render() {
    return html`
      <style>

        #map {
          height: 100vh;
          margin-left: 340px;
        }

        @media (max-width: 460px) {
          #map {
            margin-left: 0;
            height: 60vh;
          }
        }
      </style>
      <div id="map"></div>
    `;
  }

  _calculateRoutes(type) {
    if (!this.route[type]) return;

    const directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: type === 'pick_up' ? '#332266' : '#9b8dc4',
        strokeOpacity: 0.6,
        strokeWeight: 5,
      },
    });

    directionsRenderer.setMap(map);

    const originObject = this.route[type].shift();
    const destinationObject = this.route[type].pop();
    const origin = new google.maps.LatLng(originObject.latitude, originObject.longitude);
    const destination = new google.maps.LatLng(destinationObject.latitude, destinationObject.longitude);
    directionsService.route(
      {
        origin,
        destination,
        waypoints: this._createWaypoints(this.route[type]),
        travelMode: 'DRIVING',
        optimizeWaypoints: true,
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          window.alert(`irections request failed due to ${status}`);
        }
      },
    );
  }

  _createWaypoints(stops) {
    return stops.map((s) => ({ location: new google.maps.LatLng(s.latitude, s.longitude), stopover: true }));
  }
}

window.customElements.define('home-view', HomeView);
