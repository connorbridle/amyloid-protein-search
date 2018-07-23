
$( document ).ready(function() {
    var url = "motifTest.py"
    $("#submitButton").click(function() {
      if ($("#UnipotAccessCode").val() || $("#FASTAinput").val()) {
        var accessionInput = $("#UnipotAccessCode").val();
		//Deals with the cases when you pass an 'undefined' variable to the python script
        if (accessionInput == "")
        {
          accessionInput = "null";
        }
        var fastaInputString = $("#FASTAinput").val();
		//Deals with the cases when you pass an 'undefined' variable to the python script
        if (fastaInputString == "")
        {
          fastaInputString = "null"
        }
        //Ajax request is sent to the python script stored on the webserver,
        //Relevant data is passed to the script through the request.
        $.ajax({
            url: url,
            type: "POST",
            dataType: "text",
            data: {"code":accessionInput, "fasta":fastaInputString},
            success: function(response) {
		                 //$("#foo").html(response);
					 //Passes the response from the python script to the printOutputHTML method
                     console.log(response);
                     printOutputHTML(response);
                  }
		  });
    }
    // else if ($("#UnipotAccessCode").val()) {
    //     var accessionInput = $("#UnipotAccessCode").val();
    //     $.ajax({
    //         url: url,
    //         type: "POST",
    //         data: {"code":accessionInput},
    //         success: function(response) {
		//                  $("#foo").html(response);
    //                  testMethod(response);
    //               }
		//   });
    // }
      else {
          alert("You need to enter either a Uniprot accession code or a protein FASTA sequence to query.");
      }
    });
	function printOutputHTML(data) {
		var results = data.split("\n");
		  console.log(results.length)
		  for (i = 0; i < results.length; i++) {
        if (results[i] != "end") {
          $("#foo").append("<p>Results: " + results[i] + ".</p>");
          $("#foo").append("\n");
        }
		  }
		}

});


