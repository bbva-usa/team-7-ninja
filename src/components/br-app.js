import { LitElement, html, css } from 'lit-element';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query';
import { installOfflineWatcher } from 'pwa-helpers/network';
import { installRouter } from 'pwa-helpers/router';
import { updateMetadata } from 'pwa-helpers/metadata';
import { Services } from './services';

import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall';
import '@polymer/paper-card/paper-card';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/iron-icons/hardware-icons';

import './snack-bar';
import './br-map';
import './br-drawer';

class BrApp extends LitElement {
  static get properties() {
    return {
      appTitle: { type: String },
      _page: { type: String },
      _drawerOpened: { type: Boolean },
      _snackbarOpened: { type: Boolean },
      _offline: { type: Boolean },
      _schools: { type: Array },
      _selectedRoute: { type: Object },
      _selecedSchool: { type: Object },
      _persistDrawer: { type: Boolean },
      _sliderOpened: { type: Boolean },
      _arrowIcon: { type: String },
    };
  }

  static get styles() {
    return [
      css`
        :host {
          display: block;
          font-family: 'Muli';

          --app-drawer-width: 340px;

          --app-primary-color: #FFCC00;
          --app-secondary-color: #332266;
          --app-dark-text-color: var(--app-secondary-color);
          --app-light-text-color: white;
          --app-section-even-color: #f7f7f7;
          --app-section-odd-color: white;

          --app-header-background-color: white;
          --app-header-text-color: var(--app-dark-text-color);
          --app-header-selected-color: var(--app-secondary-color);

          --app-drawer-background-color: var(--app-secondary-color);
          --app-drawer-text-color: var(--app-light-text-color);
          --app-drawer-selected-color: var(--app-secondary-color);

          --iron-icon-width: 50px;
          --iron-icon-height: 50px;
        }

        app-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          text-align: center;
          background-color: var(--app-header-background-color);
          color: var(--app-header-text-color);
          border-bottom: 1px solid #eee;
        }

        #mobile-drawer {
          display: none;
        }

        main {
          display: block;
        }

        .main-content {
          min-height: 100vh;
        }

        .page {
          display: none;
        }

        .page[active] {
          display: block;
        }

        #up-icon-containor {
          text-align: center;
        }

        paper-icon-button {
          width: 100%;
        }

        @media (max-width: 460px) {
          #mobile-drawer {
            display: block;
            height: 40vh;
            background-color: #fff;
            overflow-y: hidden;
            transition: height 0.08s linear;
          }
  
          #mobile-drawer[open] {
            position: absolute;
            height: 80vh;
            top: 20vh;
            overflow: scroll;
          }

          #desktop-drawer {
            display: none;
          }
        }
      `,
    ];
  }

  render() {
    return html`
      <!-- Drawer content -->
      <app-drawer
        id="desktop-drawer"
        .opened="${this._drawerOpened}"
        .persistent="${this._persistDrawer}"
        @opened-changed="${this._drawerOpenedChanged}">
        <br-drawer
          .schools="${this._schools}"
          @selected-route-changed="${this._selectedRouteChanged}">
        </br-drawer>
      </app-drawer>

      <!-- Main content -->
      <main role="main" class="main-content">
        <br-map
          class="page"
          ?active="${this._page === 'home'}"
          .route="${this._selectedRoute}">
        </br-map>
        <div
          id="mobile-drawer"
          class="slider"
          ?open="${this._sliderOpened}">
          <div id="up-icon-containor">
            <paper-icon-button
              id="up-icon"
              @click="${this._openSlider}"
              .icon="${this._arrowIcon}">
            </paper-icon-button>
          </div>
          <br-drawer
          .schools="${this._schools}"
          .appTitle="Fairfield Bus Routes"
            @selected-route-changed="${this._selectedRouteChanged}">
          </br-drawer>
        </div>
      </main>

      <snack-bar ?active="${this._snackbarOpened}">
        You are now ${this._offline ? 'offline' : 'online'}.
      </snack-bar>
    `;
  }

  constructor() {
    super();
    this._sliderOpened = false;
    this._drawerOpened = false;
    this._persistDrawer = true;
    this._selectedRoute = {};
    this._arrowIcon = 'hardware:keyboard-arrow-up';

    setPassiveTouchGestures(true);

    Services
      .schools
      .getAll()
      .then((res) => {
        this._schools = res;
      });
  }

  firstUpdated() {
    installRouter((location) => this._locationChanged(location));
    installOfflineWatcher((offline) => this._offlineChanged(offline));
    installMediaQueryWatcher('(min-width: 460px)',
      (matches) => {
        this._persistDrawer = matches;
        this._drawerOpened = matches;
      });
  }

  updated(changedProps) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle;
      updateMetadata({
        title: pageTitle,
        description: pageTitle,
      });
    }
  }


  _openSlider() {
    this._sliderOpened = !this._sliderOpened;
    this._arrowIcon = this._arrowIcon === 'hardware:keyboard-arrow-up'
      ? 'hardware:keyboard-arrow-down'
      : 'hardware:keyboard-arrow-up';
  }

  _layoutChanged() {
    this._updateDrawerState(false);
  }

  _selectedRouteChanged({ detail }) {
    if (this._sliderOpened) {
      this._openSlider();
    }

    this._selectedRoute = detail;
  }

  _offlineChanged(offline) {
    const previousOffline = this._offline;
    this._offline = offline;

    // Don't show the snackbar on the first load of the page.
    if (previousOffline === undefined) {
      return;
    }

    clearTimeout(this.__snackbarTimer);
    this._snackbarOpened = true;
    this.__snackbarTimer = setTimeout(() => { this._snackbarOpened = false; }, 3000);
  }

  _locationChanged(location) {
    const path = window.decodeURIComponent(location.pathname);
    const page = path === '/' ? 'home' : path.slice(1);

    this._page = page;

    this._updateDrawerState(false);
  }

  _updateDrawerState(opened) {
    if (opened !== this._drawerOpened) {
      this._drawerOpened = opened;
    }
  }

  _drawerOpenedChanged(e) {
    this._updateDrawerState(e.target.opened);
  }
}

window.customElements.define('br-app', BrApp);
