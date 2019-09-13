import { html, LitElement } from 'lit-element';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles';
import '@polymer/paper-tabs/paper-tabs';
import '@polymer/paper-tabs/paper-tab';

let directionsRenderer;

let map;
const MARKER_TRACKER = [];

const {
  maps: {
    ControlPosition: {
      TOP_CENTER,
      LEFT_TOP,
    },
    event,
    InfoWindow,
    DirectionsService,
    DirectionsRenderer,
    LatLng,
    Map,
    Marker,
  },
} = google;

const directionsService = new DirectionsService();


class BrMap extends LitElement {
  static get styles() {
    return [
      SharedStyles,
    ];
  }

  static get properties() {
    return {
      route: { type: Array },
      _currentSwitch: { type: String },

    };
  }

  constructor() {
    super();
    this.route = {};
    this._currentSwitch = 'pick_up';
  }

  firstUpdated() {
    map = new Map(this.shadowRoot.querySelector('#map'), {
      center: { lat: 33.4757032, lng: -86.94038 },
      zoom: 13,
    });
    const infoWindow = new InfoWindow();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent('Current Location');
        infoWindow.open(map);
        map.setCenter(pos);
      }, (err) => console.error('Error Getting Lcation', err));
    }

    installMediaQueryWatcher('(min-width: 460px)',
      (matches) => {
        const dropOffSwitch = this.shadowRoot.querySelector('#drop-off-switch');
        map.controls[matches ? TOP_CENTER : LEFT_TOP].push(dropOffSwitch);
      });
  }

  updated(changedProperties) {
    if (!changedProperties.has('route')) return;

    this._calculateRoutes();
  }

  render() {
    return html`
      <style>
        :host {
          --paper-tab-ink: var(--app-secondary-color);
          --paper-tabs-selection-bar-color: var(--app-secondary-color);
        }
        #map {
          height: 100vh;
          margin-left: 340px;
        }

        paper-tabs {
          background-color: white;
          color: black;
          margin-top: 3%;
        }

        @media (max-width: 460px) {
          #map {
            margin-left: 0;
            height: 60vh;
          }

          paper-tabs {
            margin-left: 6%;
          }
        }
      </style>
      <div id="map"></div>
      <div id="drop-off-switch">
        <paper-tabs
          selected="0"
          @selected-changed="${this._optionChanged}">
          <paper-tab>Pick Up</paper-tab>
          <paper-tab>Drop Off</paper-tab>
        </paper-tabs>
      </div>
    `;
  }

  _optionChanged({ target: { selected } }) {
    this._currentSwitch = Number(selected) === 0 ? 'pick_up' : 'drop_off';
    this._calculateRoutes();
  }

  _calculateRoutes() {
    const type = this._currentSwitch;

    if (!this.route[type]) return;

    this._resetRenderer(type);
    this._resetMarkers();

    const markerArray = [];
    const stepDisplay = new InfoWindow();
    const originalWaypoints = JSON.parse(JSON.stringify(this.route[type]));
    const originObject = originalWaypoints.shift();
    const destinationObject = originalWaypoints.pop();
    const origin = new LatLng(originObject.latitude, originObject.longitude);
    const destination = new LatLng(destinationObject.latitude, destinationObject.longitude);

    directionsService.route(
      {
        origin,
        destination,
        waypoints: this._createWaypoints(originalWaypoints),
        travelMode: 'DRIVING',
        optimizeWaypoints: true,
      },
      (response, status) => {
        if (status === 'OK') {
          this._createMarkers(response, markerArray, stepDisplay, type);

          directionsRenderer.setDirections(response);
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      },
    );
  }

  _createMarkers(directionResult, markerArray, stepDisplay, type) {
    const routePoints = directionResult.routes[0].legs;

    routePoints.forEach((routePoint, i) => {
      const marker = markerArray[i] || new Marker({ label: (i + 1).toString() });
      const { name, time } = this.route[type][i];
      const textToDisplay = this._createPopuptext(name, type, time);

      marker.setMap(map);
      marker.setPosition(routePoint.start_location);

      event.addListener(marker, 'click', () => {
        stepDisplay.setContent(textToDisplay);
        stepDisplay.open(map, marker);
      });

      MARKER_TRACKER.push(marker);
    });
  }

  _resetMarkers() {
    MARKER_TRACKER.forEach((m) => m.setMap(null));
  }

  _resetRenderer(type) {
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }

    directionsRenderer = new DirectionsRenderer({
      polylineOptions: {
        strokeColor: type === 'pick_up' ? '#332266' : '#9b8dc4',
        strokeOpacity: 0.6,
        strokeWeight: 5,
      },
      suppressMarkers: true,
    });

    directionsRenderer.setMap(map);
  }

  _createPopuptext(name, type, time) {
    return `${name}<br>
    ${type === 'pick_up' ? 'Pick Up' : 'Drop Off'}: ${time}
    `;
  }

  _createWaypoints(stops) {
    return stops.map((s) => ({ location: new LatLng(s.latitude, s.longitude), stopover: true }));
  }
}

window.customElements.define('br-map', BrMap);
