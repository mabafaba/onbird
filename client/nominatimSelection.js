class NominatimSelection extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.innerHTML = `
                <link rel="stylesheet" href="custom_classless.css">
                <input type="text" id="location" name="location" placeholder="Enter zip code" value="12053">
                <button id="searchButton" style="display:inline-block;">find</button>
                <p id="searchResults"></p>
                <p id="selectedLocation"></p>
            `;

            this.selectedLocation = null;
            this.onSelection = (place) => {console.log('Selected location:', place)};
            this.onSearch = (search, results) => {
            
            };
        }

        connectedCallback() {
            this.shadowRoot.querySelector('#searchButton').addEventListener('click', () => this.findLocation());
        }

        findLocation() {
            const searchResultContainer = this.shadowRoot.querySelector('#searchResults');
            searchResultContainer.innerHTML = '';

            const selectedLocationContainer = this.shadowRoot.querySelector('#selectedLocation');
            selectedLocationContainer.innerHTML = '';

            const searchButton = this.shadowRoot.querySelector('#searchButton');
            searchButton.innerHTML = 'Loading...';

            const search = this.shadowRoot.querySelector('#location').value;

            fetch(`https://nominatim.openstreetmap.org/search?q=${search}&format=json&addressdetails=1`)
                .then(response => response.json())
                .then(data => {
                    searchButton.innerHTML = 'find';
                    console.log('onsearch', this.onSearch);
                    this.onSearch(search, data);
                    if (data.length == 0) {
                        const noResult = document.createElement('p');
                        noResult.innerHTML = 'No matching location found';
                        searchResultContainer.appendChild(noResult);
                        return;
                    }
                    data = data.filter(place => place.address.postcode);

                    data.forEach((place) => {
                        const button = document.createElement('button');
                        button.innerHTML = place.display_name;
                        button.onclick = () => {
                            this.selectedLocation = place;
                            selectedLocationContainer.innerHTML = place.display_name;
                            searchResultContainer.innerHTML = '';
                            this.onSelection(place);
                        };
                        searchResultContainer.appendChild(button);
                    });

                    
                })
                .catch(error => {
                    console.error('Error:', error);
                    searchButton.innerHTML = 'find';
                });
        }
    }

    customElements.define('nominatim-selection', NominatimSelection);
