/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css } from 'lit-element';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

// These are the elements needed by this element.
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/iron-collapse/iron-collapse.js';
import { menuIcon } from './my-icons.js';
import './snack-bar.js';
import { Services } from './services';

class MyApp extends LitElement {
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
    };
  }

  static get styles() {
    return [
      css`
        :host {
          display: block;

          --app-drawer-width: 300px;

          --app-primary-color: #FFCC00;
          --app-secondary-color: #332266;
          --app-dark-text-color: var(--app-secondary-color);
          --app-light-text-color: white;
          --app-section-even-color: #f7f7f7;
          --app-section-odd-color: white;

          --app-header-background-color: white;
          --app-header-text-color: var(--app-dark-text-color);
          --app-header-selected-color: var(--app-primary-color);

          --app-drawer-background-color: var(--app-secondary-color);
          --app-drawer-text-color: var(--app-light-text-color);
          --app-drawer-selected-color: var(--app-primary-color);
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

        .toolbar-top {
          background-color: var(--app-header-background-color);
        }

        [main-title] {
          font-family: 'Muli';
          font-size: 30px;
          /* In the narrow layout, the toolbar is offset by the width of the
          drawer button, and the text looks not centered. Add a padding to
          match that button */
          padding-right: 44px;
        }

        .toolbar-list {
          display: none;
        }

        #mobile-drawer {
          display: none;
        }

        .toolbar-list > a {
          display: inline-block;
          color: var(--app-header-text-color);
          text-decoration: none;
          line-height: 30px;
          padding: 4px 24px;
        }

        .toolbar-list > a[selected] {
          color: var(--app-primary-color);
          border-bottom: 4px solid var(--app-header-selected-color);
        }

        .menu-btn {
          background: none;
          border: none;
          fill: var(--app-header-text-color);
          cursor: pointer;
          height: 44px;
          width: 44px;
        }

        .drawer-list {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          padding: 24px;
          background: var(--app-drawer-background-color);
          position: relative;
        }

        .drawer-list > a {
          display: block;
          text-decoration: none;
          color: var(--app-drawer-text-color);
          line-height: 40px;
          padding: 0 24px;
          font-size: 12pt;
          cursor: pointer;
        }

        .drawer-list > iron-collapse {
          display: block;
          color: var(--app-drawer-text-color);
          line-height: 40px;
          padding: 0 40px;
          font-size: 10pt;
          cursor: pointer;
        }

        .drawer-list > a[selected] {
          color: var(--app-drawer-selected-color);
        }

        .drawer-list > h2 {
          color: var(--app-drawer-text-color);
        }

        /* Workaround for IE11 displaying <main> as inline */
        main {
          display: block;
        }

        .main-content {
          padding-top: 64px;
          min-height: 100vh;
        }

        .page {
          display: none;
        }

        .page[active] {
          display: block;
        }

        @media (max-width: 460px) {
          #mobile-drawer {
            display: block;
            height: 30vh;
            overflow: scroll;
          }
          #desktop-drawer {
            display: none;
          }
        }
      `
    ];
  }

  render() {
    // Anything that's related to rendering should be done in here.
    return html`
      <!-- Header -->
      <app-header condenses reveals effects="waterfall">
        <app-toolbar class="toolbar-top">
          <div main-title>${this.appTitle}</div>
        </app-toolbar>
      </app-header>

      <!-- Drawer content -->
      <app-drawer
          id="desktop-drawer"
          .opened="${this._drawerOpened}"
          .persistent="${this._persistDrawer}"
          @opened-changed="${this._drawerOpenedChanged}">
          ${this._getAppDrawer()}
        </nav>
      </app-drawer>

      <!-- Main content -->
      <main role="main" class="main-content">
        <home-view
          class="page"
          ?active="${this._page === 'home'}"
          .route="${this._selectedRoute}">
        </home-view>
        <div id="mobile-drawer">
          ${this._getAppDrawer()}
        </div>
      </main>

      <snack-bar ?active="${this._snackbarOpened}">
        You are now ${this._offline ? 'offline' : 'online'}.
      </snack-bar>
    `;
  }

  constructor() {
    super();
    this._drawerOpened = false;
    this._persistDrawer = true;
    this._schools = [];
    this._selectedRoute = {};
    this._selecedSchool = {};
    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/3.0/docs/devguide/settings#setting-passive-touch-gestures
    setPassiveTouchGestures(true);

    Services.schools.getAll()
      .then(res => {
        this._schools = res;
      });
  }

  firstUpdated() {
    installRouter((location) => this._locationChanged(location));
    installOfflineWatcher((offline) => this._offlineChanged(offline));
    installMediaQueryWatcher(`(min-width: 460px)`,
        (matches) =>{
          this._persistDrawer = matches;
          this._drawerOpened = matches;
        });
  }

  updated(changedProps) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle + ' - ' + this._page;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
        // This object also takes an image property, that points to an img src.
      });
    }
  }

  _schoolClicked({ target: { id } }) {
    this._selecedSchool = this._schools.find(r => r.school_id === id);
    this.shadowRoot.querySelector(`#collapse-${id}`).toggle();
    this.requestUpdate();
  }

  _routeClicked(schoolId, routeId) {

    Services.routes.getRouteBySchoolId(schoolId, routeId)
      .then(route => {
        this._selectedRoute = route; 
      });
  }

  _isRouteSelected(school_id) {
    return school_id === this._selecedSchool.school_id;
  }

  _getAppDrawer() {
    return html`
      <nav class="drawer-list">
          <h2>Schools</h2>
          ${this._schools.map(school =>
          html`<a id="${school.school_id}" @click="${this._schoolClicked}" ?selected="${this._isRouteSelected(school.school_id)}">
            ${school.school_ds}
          </a>
          <iron-collapse id="collapse-${school.school_id}">
            ${school.routes.map(r => html`<div routeId="${r.route_id}" schoolId="${school.school_id}" @click="${this._routeClicked.bind(this, school.school_id, r.route_id)}">${r.route_ds}</div>`)}
          </iron-collapse>
          `
        )}
      </nav>
      `;
  }

  _layoutChanged(isWideLayout) {
    // The drawer doesn't make sense in a wide layout, so if it's opened, close it.
    this._updateDrawerState(false);
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
    this.__snackbarTimer = setTimeout(() => { this._snackbarOpened = false }, 3000);
  }

  _locationChanged(location) {
    const path = window.decodeURIComponent(location.pathname);
    const page = path === '/' ? 'home' : path.slice(1);
    this._loadPage(page);
    // Any other info you might want to extract from the path (like page type),
    // you can do here.

    // Close the drawer - in case the *path* change came from a link in the drawer.
    this._updateDrawerState(false);
  }

  _updateDrawerState(opened) {
    if (opened !== this._drawerOpened) {
      this._drawerOpened = opened;
    }
  }

  _loadPage(page) {
    switch(page) {
      case 'home':
        import('../components/home-view.js');
        break;
      case 'view2':
        import('../components/my-view2.js');
        break;
      case 'view3':
        import('../components/my-view3.js');
        break;
      default:
        page = 'view404';
        import('../components/my-view404.js');
    }

    this._page = page;
  }

  _menuButtonClicked() {
    this._updateDrawerState(true);
  }

  _drawerOpenedChanged(e) {
    this._updateDrawerState(e.target.opened);
  }
}

window.customElements.define('my-app', MyApp);
