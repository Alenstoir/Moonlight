var dateOpts = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}



function hideOnClickOutside(element) {
    const outsideClickListener = event => {
        if (!element.contains(event.target) && isVisible(element)) { // or use: event.target.closest(selector) === null
			//element.removeAttribute('current');
        	console.log("now dis");
			element.removeAttribute('data-show');
        	removeClickListener();
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }

    document.addEventListener('click', outsideClickListener)
}

const isVisible = elem => {
	if (elem.attributes['data-show']) {
		return true;
	} else {
		return false;
	}
} 

var updateIcon = function(img, path) {
	img.src = path + "?" + new Date().getTime();
}

window.onload = function(){


	console.log("connectign");	

	if($("#controller")[0].innerText == ""){
		$('#logout').click();
	}						

	$(".vbutton").on("click", function(){
		$(".vbutton").removeClass("active");
		$(this).addClass("active");
		$("#bodyForm").empty();
		$.ajax({
			url: $(this)[0].id,
			method: "post",
			data: "",
			complete: function(res) {
				$("#bodyForm").append(res.responseText);
				$("#sideForm").empty();
				$("#bodyForm").slideDown();		
			}
		})
	});

	$('#logout').on('click', function(){
		$.ajax({
			url: "/logout",
			method: "post",
			data: "",
			complete: function(res) {
				window.location.reload(true);
			}
	})});

	$('#profile').on('click', function(){
		$.ajax({
			url: "/users/profile",
			method: "post",
			data: "",
			complete: function(res) {
				$("#sideForm").empty();	
				$("#bodyForm").slideDown();
				$("#bodyForm").empty();
				$("#bodyForm").append(res.responseText);
			}
	})});
}


var org = function(body){
	$.ajax({
			url: "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party",
			method: "post",
			data: "",
			complete: function(res) {
				window.location.reload(true);
			}
	})
}

var control = function(e, mode) {
	if (mode == 'none') {
		$.ajax({
			url: "/kurs/enroll",
			method: "post",
			data: {id: e.target.id},
			complete: function(res) {
				if (res.responseText) {
					console.error(res.responseText);
				} else {
					$("#bodyForm .active").click();
				}
			}
		})		
	} else if (mode == 'edu') {
		$.ajax({
			url: "/kurs/edu",
			method: "post",
			data: {id: e.target.id},
			complete: function(res) {
				console.log(res);
				$("#sideForm").empty();
				$("#sideForm").append(res.responseText);
				$("#bodyForm").slideUp();				
			}
		})
	} else if (mode == 'clearSide') {
				$("#sideForm").empty();
				$("#bodyForm").slideDown();				
	}  else if (mode == 'close') {
		$.ajax({
			url: "/kurs/close",
			method: "post",
			data: {id: e.target.id},
			complete: function(res) {
				window.location.href = res.responseText;
				window.location.href = '/';
			}
		})				
	} else {
		$.ajax({
			url: "/kurs/manage",
			method: "post",
			data: {id: e.target.id},
			complete: function(res) {
				$("#kursHandler").empty();
				$("#kursHandler").append(res.responseText);				
			}
		})	
	}
}

var getLocDate = function(date){

	console.log(date.toLocaleString('ru', dateOpts));
}