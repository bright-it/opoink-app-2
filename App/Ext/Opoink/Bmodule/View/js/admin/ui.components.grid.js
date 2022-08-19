define([
	'jquery',
	'request',
	'vue'
], function($, req, Vue) {

	var grid = new Vue({
		data() {
			return {
				listingName: '',
				columns: null,
				list_data: null,
				filters: {},
				limits: null,
				setListingName: (listingName) => {
					this.listingName = listingName;
					return this;
				},
				getListingName: () => {
					return this.listingName;
				},
				getListing: () => {
					$('#main-page-loader').removeClass('d-none');
					req.doRequest(adminUrl + 'uicomponents/grid/listing?listing_name='+this.getListingName(), JSON.stringify(this.filters), 'POST')
					.then(result => {
						console.log('getListing getListing', result);
						if(typeof result.columns != 'undefined'){
							this.columns = result.columns;
							this.list_data = result.list_data;
							this.filters = result.filters;
							this.limits = result.limits;
						}
						$('#main-page-loader').addClass('d-none');
					}).catch(error => {
						$('#main-page-loader').addClass('d-none');
					});
				},
				goToPrevPage: () => {
					if(parseInt(this.list_data.current_page) > 1){
						this.filters.filters.page = parseInt(this.list_data.current_page) - 1;
						this.getListing();
					}
				},
				goToNextPage: () => {
					if(parseInt(this.list_data.total_page) > parseInt(this.list_data.current_page)){
						this.filters.filters.page = parseInt(this.list_data.current_page) + 1;
						this.getListing();
					}
				},
				goToPage: () => {
					if(parseInt(this.filters.filters.page) >= 1 && parseInt(this.filters.filters.page) <= parseInt(this.list_data.total_page)){
						this.filters.filters.page = parseInt(this.filters.filters.page);
						this.getListing();
					}
					else {
						this.filters.filters.page = this.list_data.current_page;
					}
				},
				changeLimitPerPage: () => {
					this.filters.filters.page = 1;
					this.filters.filters.limit = parseInt(this.filters.filters.limit);
					this.goToPage();
				},
				setOrderBy: (column) => {
					if(column.sortable){
						this.filters.filters.page = 1;
						if(typeof this.filters.filters.sort_order == 'undefined'){
							this.filters.filters.sort_order = {};
						}
	
						this.filters.filters.sort_order['order_by'] = column.column_name;
	
						if(typeof this.filters.filters.sort_order.direction == 'undefined'){
							this.filters.filters.sort_order['direction'] = 'asc';
						}
						else {
							if(this.filters.filters.sort_order['direction'] == 'asc'){
								this.filters.filters.sort_order['direction'] = 'desc';
							}
							else {
								this.filters.filters.sort_order['direction'] = 'asc';
							}
						}
						
						this.goToPage();
					}
					console.log('setOrderBy setOrderBy', column);
				},
				resetFieldValues: () => {
					var inputs = $('#admin-grid-filters-modal input');
					$.each(inputs, (key, val) => {
						$(val).val('');
					});

					var select = $('#admin-grid-filters-modal select');
					$.each(inputs, (key, val) => {
						$(val).val('');
					});
					console.log(inputs);
				},
				showFiltersModal: () => {
					$('#admin-grid-filters-modal').modal('show');
					$('#admin-grid-filters-modal').on('hide.bs.modal', (e) => {
						this.tmpSearchFields = {};
					});

					this.resetFieldValues();

					setTimeout(() => {
						$.each(this.filters.filters.search_fields, (key, val) => {
							this.tmpSearchFields[val['field']] = val;
							if(val.type == 'text'){
								$('#admin-grid-filter-' + val['field']).val(val['search_string']);
							}
							else if(val.type == 'range') {
								if(typeof val['from'] != 'undefined'){
									$('#admin-grid-filter-' + val['field'] + '-from').val(val['from']);
								}
								if(typeof val['to'] != 'undefined'){
									$('#admin-grid-filter-' + val['field'] + '-to').val(val['to']);
								}
							}
						});
					}, 100);


				},
				tmpSearchFields: {},
				updateFilter(type, column, event, fromOrTo){
						if(type == 'text'){
							if(event.target.value){
								this.tmpSearchFields[column.column_name] = {
									field: column.column_name,
									search_string: event.target.value,
									type: type,
									label: column.label
								};
							}
							else {
								if(typeof this.tmpSearchFields[column.column_name] != 'undefined') {
									delete this.tmpSearchFields[column.column_name];
								}
							}
						}
						else if(type == 'range'){
							if(typeof this.tmpSearchFields[column.column_name] == 'undefined'){
								this.tmpSearchFields[column.column_name] = {
									field: column.column_name,
									search_string: null,
									type: type,
									label: column.label
								};
							}
							if(event.target.value){
								this.tmpSearchFields[column.column_name][fromOrTo] = event.target.value;}
							else {
								if(typeof this.tmpSearchFields[column.column_name][fromOrTo] != 'undefined') {
									delete this.tmpSearchFields[column.column_name][fromOrTo];
								}
							}

							if(
								typeof this.tmpSearchFields[column.column_name]['from'] == 'undefined' && 
								typeof this.tmpSearchFields[column.column_name]['to'] == 'undefined'
							) {
								delete this.tmpSearchFields[column.column_name];
							}
						}
				},
				applyFilter(){
					this.filters.filters.search_fields = [];

					$.each(this.tmpSearchFields, (key, val) => {
						this.filters.filters.search_fields.push(val);
					});

					setTimeout(() => {
						this.filters.filters.page = 1;
						this.getListing();
						$('#admin-grid-filters-modal').modal('hide');
					}, 100);
				},
				removeFilter(search_field){
					$.each(this.filters.filters.search_fields, (key, val) => {
						if(search_field.field == val.field){
							this.filters.filters.search_fields.splice(key, 1);
						}
					});
					this.filters.filters.page = 1;
					this.getListing();
				}
			}
		},
		mounted: function(){
			$('#admin-grid-table').removeClass('d-none');
		}
	}).$mount('#admin-grid-table');

	console.log('grid grid', grid);

	return grid;
});