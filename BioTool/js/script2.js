$( document ).ready(function() {
    var url = "js/motifTest2.py"; //directory for the python file

    //Section for dealing with single query options
    //When the single query button is clicked, calls a function that carries out relevant checks and if all is in order, sends the AJAX request to the python script
    $("#submitButton").click(function() {

      //If user provides input, proceed
      if ($("#UnipotAccessCode").val() || $("#FASTAinput").val()) {
        var accessionInput = $("#UnipotAccessCode").val(); //Extracts the value from the accession code input box 
		var fastaInputString = $("#FASTAinput").val(); //Extracts the value from the fasta code input box 
		
		//If the user enters value into fasta input box and accession code input box
        if (accessionInput != "" && fastaInputString != "") {
          fastaInputString = "null"; //fastaInput set to null as no need to send large fasta data
          //Validates the accession code input, if the validateAccession method returns true. Ajax call is made because valid input (method can be found at bottom of script file)
			if (validateAccession(accessionInput)) {
				console.log("both inputs full ajax call"); //Logs the type of input
				makeAjaxCall(accessionInput, fastaInputString); //Calls the makeAjaxCall method and passes both the accessionInput and fastaInputString
          } else {
				//Else, invalid accession code according to uniprots regex. Informs user to enter valid code
				alert("Please enter a valid Uniprot accession code!"); //If validateAccession returns false, bad input-> alerts user to ammend input
          }
        }

		if (accessionInput == "")  //Deals with the cases when you pass an 'undefined' variable to the python script
        {
          accessionInput = "null"; //Sets the value of accession input as "null" which can then be checked in the python script
		  //Validates the fasta code input, if the validateAccession method returns true. Ajax call is made because valid input
		  if (validateFASTA(fastaInputString)) {
			  console.log("fasta ajax call"); //Logs the type of input
			  makeAjaxCall(accessionInput, fastaInputString); //Calls the makeAjaxCall method and passes both the accessionInput and fastaInputString
		  } else {
			  //Else, invalid fasta code according to regex. Informs user to enter valid code
			  alert("Please enter a valid 'FASTA' formatted code!");
		  }
        }

        if (fastaInputString == "")  //Deals with the cases when you pass an 'undefined' variable to the python script
        {
          fastaInputString = "null"; //Sets the value of fastaInputString as "null" which can then be checked in the python script
          //Validates the accession code input, if the validateAccession method returns true. Ajax call is made because valid input
          if (validateAccession(accessionInput)) {
			    console.log("accession ajax call");
				makeAjaxCall(accessionInput, fastaInputString);
          } else {
			//Else, invalid accession code according to uniprots regex. Informs user to enter valid code
            alert("Please enter a valid Uniprot accession code!");
          }
        }

    }
	  //No input provided when button clicked
      else {
          alert("You need to enter either a Uniprot accession code or a protein FASTA sequence to query.");
      }
    });

	//Section for dealing with batch inputs
	//When the batch query button is clicked, calls a function that carries out relevant checks and if all is in order, sends the AJAX request to the python script
    $("#submitButton2").click(function() {
      //Check to see if user provided an input
      if ($("#batchInputBox").val()) {
        var batchUserInput = $("#batchInputBox").val(); //Store the value inputted by user
        makeBatchAjaxCall(batchUserInput); //Calls the makeBatchAjaxCall which sends an AJAX request to the python script
      } else {
		//If no value is entered when button is clicked, inform the user
        alert("You need to enter at least 1 accession code to submit!");
      }
    });

	//When load batch example button is clicked
	$("#loadExampleButton").click(function() {
		//String literal that holds some example data
		var exampleData = `P38398
P10636
P10997
P04156
P05067
P02647`;
		$("#batchInputBox").val(exampleData); //Paste the exampleData into the batchInputBox
	});

	//When load single example button is clicked
	$("#loadAccession").click(function() {
		//Variable that holds an example input
		var exampleData = "P38398";
		$("#UnipotAccessCode").val(exampleData); //Paste the exampleData into the UnipotAccessCode input box
	});

    //Function that makes the ajax calls
    function makeAjaxCall(accessionInput, fastaInputString) {
      $("#singleQueryResults").append("<h2>Loading results</h2>"); //Append loading title to output area
	  $("#singleQueryResults").append("<hr>"); //Append line split
	  //Make ajax request, specifies where the python file is, the type is a POST as posting data, the datatype is JSON, and then send the data obtained above
	  //When the submit button is pressed.
	  $.ajax({
          url: url,
          type: "POST",
          dataType: "json",
          data: JSON.stringify({'inputData': [{'accession': accessionInput,'fasta': fastaInputString}]}),
          success: function(response) {
					//If the error data contains the "no_sequence_found" flag sent from the python script, there was an error finding the sequence from UniProt
					if (response['error_data'].includes("no_sequence_found")) {
						alert("No sequence found, please enter a valid accession code");
					} else {
						//Passes the response from the python script to the printOutputHTML method
						printSingleOutputHTML(response);
					}
                },
		  error: function() {
					alert("AJAX REQUEST FAILED, PLEASE ENSURE YOU HAVE INTERNET ACCESS"); //Cleanup incase of AJAX call fails
				}
              });
    } //end function

    //Function that makes the batch query ajax call
    function makeBatchAjaxCall(accessionInput) {
      $("#batchResults").append("<h2>Loading results</h2>"); //Append loading title to output area
	  $("#batchResults").append("<hr>"); //Append line split
	  //Make ajax request, specifies where the python file is, the type is a POST as posting data, the datatype is JSON, and then send the data obtained above
	  //When the submit button is pressed.
	  $.ajax({
          url: url,
          type: "POST",
          dataType: "json",
          data: JSON.stringify({'inputData': [{'accession': accessionInput,'fasta': 'BATCH'}]}),
          success: function(response) {
  					//If there is errors in the batch accession codes,
  					if (response['error_data'].length > 0) {
  						var size = response['error_data'].length; //Store size of error data
  						var accessionErrorData = []; //Creates an array of the size of the error data array
  						//Populates the accessionErrorData with the errors found in the batch input
  						for (b = 0;b < size; ++b) {
  							accessionErrorData.push("Accession errors: " + response['error_data'][b] + "\n")
  						}
  						alert(accessionErrorData); //Alerts the users of the accession errors found
  						printBatchOutputHTML(response); //Prints the remaining successful data items back to the user
  					} else {
  						printBatchOutputHTML(response); // When there is no error data, only need to print the data to the user
  					}
          },
		  error: function() {
						alert("AJAX REQUEST FAILED, PLEASE ENSURE YOU HAVE INTERNET ACCESS"); //Cleanup incase of AJAX call fails
		  }
        });
    } //end function

    //Function that deals with validating the accession input to ensure appropiate format is submitted
    function validateAccession(accession_code) {
      var accessionRegex = new RegExp("[opqOPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}");  //Regex used for ensuring accession code input matches Uniprot format
      //Using the RegExp .test() function to test whether the inputted accession code matches the regex format. If it does, return true, else false
      if (accessionRegex.test($("#UnipotAccessCode").val())) {
        return true;
      } else {
        return false;
      }
    }

    //Function that deals with validating the fasta input to ensure appropiate format is submitted
    function validateFASTA(fastaInputString) {
	  var fastaRegex = new RegExp("^[>;][\\s\\S]*[*ARNDCQEGHILKMFPSTWYV]$"); //Regex used for ensuring fasta code input matches Uniprot format
	  //Using the RegExp .test() function to test whether the inputted fasta code matches the regex format. If it does, return true, else false
	  if (fastaRegex.test($("#FASTAinput").val())) {
		  return true;
	  } else {
		  return false;
	  }
    }

    //Function that deals with printing the data acquired from the JSON object to the html (includes generating tags etc)
    function printSingleOutputHTML(data) {

      var dataArray = data['success_data'][2].motifs_found; //First data item held in the motifs_found section of JSON object

      $("#singleQueryResults").empty(); //Empty the div each time the function is called
	  $("#batchResults").empty(); //Empty the div each time the function is called
      $("#singleQueryResults").append("<h2>Matches Found</h2>"); //Append title to output area
      $("#singleQueryResults").append("<hr>"); //Append line split
      $("#singleQueryResults").append("<h2> Protein Name <h2>"); //Append the protein name title

      $("#singleQueryResults").append("<h4>" + data['success_data'][0].protein_name + "</h4>"); //Outputs the protein name from the JSON object return from python
      $("#singleQueryResults").append("<h2> Full Sequence <h2>"); //Appends sequence title to output area
      $("#singleQueryResults").append('<p style="word-wrap: break-word; font-size:10px;">' + data['success_data'][1].full_sequence + '</p>'); ////Outputs the full_sequence from the JSON object return from python

      $("#singleQueryResults").append("<h2> Matches found <h2>"); //Appends the matches title to output area
      for (i=0; i<dataArray.length;i++) {
        console.log("<p> Match: " + "Start position-" + dataArray[i].start_pos + " " +  "Sequence-" +dataArray[i].sequence_found + " " + "End position-" + dataArray[i].end_pos + "</p>"); //Logs a single line of matches
		//This line concatenates all the relevants pieces of information together in a string and then appends it to the output div. All the pieces of information are accessed through the JSON return data
        $("#singleQueryResults").append("<p> <strong>Match</strong>: " + "Start position: " + dataArray[i].start_pos + "->" +  "Sequence: " + dataArray[i].sequence_found + "->" + "End position: " + dataArray[i].end_pos + "</p>");
        $("#singleQueryResults").append("<hr>"); //Append line split
      }
		} //end function

    //Function that deals with printing JSON data aquired from batch input (includes generating tags etc)
    function printBatchOutputHTML(data) {

      var proteinsFoundArray = data['success_data'][0]; //Variable that holds the proteins found data
	  $("#batchResults").empty(); //Empty the div each time the function is called
	  $("#singleQueryResults").empty(); //Empty the div each time the function is called
	  $("#batchResults").append("<h2>Results</h2>"); //Append results title
      $("#batchResults").append("<hr>"); //Append a line separator to split up results

	  //For two for loops loop through the proteinsFoundArray and output the matches found for each of the proteins
	  for(x=0; x<proteinsFoundArray.length; x++) {
		$("#batchResults").append("<h2> Protein Name <h2>"); //Appends protein name title
		$("#batchResults").append("<h4>" + proteinsFoundArray[x].protein_name + "</h4>"); //Outputs the protein name from the JSON object return from python
		$("#batchResults").append("<h2> Full Sequence <h2>"); //Appends full sequence title
		$("#batchResults").append('<p style="word-wrap: break-word; font-size:10px;">' + proteinsFoundArray[x].full_sequence + '</p>'); //Outputs the full_sequence from the JSON object return from python
        $("#batchResults").append("<h2>Matches Found</h2>"); //Outputs matches found title
		
		//Loops through the motifsFoundArray for the current protein using the 'x' from the outer for loop
		var motifsFoundArray = proteinsFoundArray[x].motifs_found;
		for (i=0; i<motifsFoundArray.length;i++) {
          console.log("Data item: " + motifsFoundArray[i].start_pos + " " + motifsFoundArray[i].sequence_found + " " + motifsFoundArray[i].end_pos); //Logs a single line of matches
		  //This line concatenates all the relevants pieces of information together in a string and then appends it to the output div. All the pieces of information are accessed through the JSON return data
          $("#batchResults").append("<p> <strong>Match</strong>: " + "Start position: " + motifsFoundArray[i].start_pos + "->" + "Sequence: " + 
		   motifsFoundArray[i].sequence_found + "->" + "End position: " + motifsFoundArray[i].end_pos +"</p>")
        }
        $("#batchResults").append("<hr>"); //Appends a line split
      }
		} //end function

}); //END SCRIPT FILE
