#!/usr/local/bin/python2.7


###########BELOW IS THE GENERAL LAYOUT OF THE JSON OBJECT THAT IS BEING CONSTRUCTED THROUGHOUT THE SCRIPT###########
###########            BATCH INPUT ADDS AN EXTRA ARRAY TO HOLD DATA FOR EACH PROTEIN SEARCHED            ###########
#outputData: [{
#   success_data {
#           accession: 'xxx'
#           OR
#           fasta: 'xxx'
#           protein_name: 'xxx'
#           overlap: 'xxx'
#           motifs_found: []
#               start_pos: 'xxx'
#               sequence_found: 'xxx'
#               end_pos: 'xxx'
#           fullsequence: 'xxx'
#}]
#   error_data {
#
#
#
#
#
#
#
#
#
#}
#
#

#####        THE JS JSON INPUT DATA IS STRUCTURED AS FOLLOWS        #####
#####{'inputData': [{'accession': accessionInput,'fasta': 'BATCH'}]}#####


import cgi
import re
from Bio import ExPASy
from Bio import SwissProt
from Bio import SeqIO
import json, sys



pythonDictionary = json.load(sys.stdin) # Loads the data from the ajax call made in the javascript file
jsonInputString = json.dumps(pythonDictionary)
jsonInputDict = json.loads(jsonInputString) # This holds the data sent from the ajax call

#Creating of the dictionary that will be encoded to a JSON string and sent back to the webpage
outputData = {'success_data': [], 'error_data': []}

# Defines the content-type/function of the script, this script will return a json object
print('Content-Type: application/json\n\n')

#Function that gets the protein name from SP database and appends it to the output data (used for FASTA formats instead of extracting protein name from it)
def get_protein_name(accession_code):
    handle = ExPASy.get_sprot_raw(accession_code)
    record = SwissProt.read(handle)
    handle.close()
    outputData['success_data'].append({'protein_name':record.entry_name}) # Appends the protein name to the successdata array of the JSON return data

# Function thatextracts the SP accession code from the FASTA sequence which can then be used in the get sequence function
def get_SPaccession_from_fasta(fasta_code):
    sequence = str(fasta_code) # Casts to a string to clean up any potential errors with datatypes
    p = re.compile(r'[opqOPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}') # Regex expression is the given one from Uniprots website which all codes follow
    match = p.search(sequence).group() # Search through the sequence and story result in match
    return match

#Function that gets the protein sequence using the Swissprot database
def get_sequence(accession_code):
    #Try-except struct used to ensure any invalid accession codes to do throw an exception and cause script to cease running
    try:
        handle = ExPASy.get_sprot_raw(accession_code)
        record = SwissProt.read(handle)
        handle.close()
        outputData['success_data'].append({'protein_name':record.entry_name}) # Appends the protein name to the successdata array of the JSON return data
        outputData['success_data'].append({'full_sequence':record.sequence}) # Appends the sequence to the successdata array of the JSON return data
        return record.sequence
    except:
        outputData['error_data'].append("no_sequence_found") #If there is an error and the accessioncode provided gives an HTTPError, append to error data
        return "null" # Return null as no sequence can be found


# Function that obtains the linear motifs using the Prosite expression given, converted into regex
def get_linear_motifs(sequence):
    innerList = [] # Creation of new list to house the motifs found
    # Stores all the sequences found that match the regex given into a iterator object
    iterObject = re.finditer(r"(?=([^P][^PKRHW][VLSWFNQ][ILTYWFN][FIY][^PKRH]))", sequence) # Regex that Includes motif overlaps
    # Loops through the iterator object to display each of the matched sequences, then a string is constructed using the start, end and sequence of the protein
    for match in iterObject:
        run_start = match.start()+1
        run_end = match.end()+6 # Sequence will always be 6 characters long (had to include this because the motif overlap expression broke the .end() function)
        #Appends each of the matches found to the Dictionary, including start_pos, sequence and
        innerList.append({'start_pos': str(run_start), 'sequence_found' : match.group(1), 'end_pos' : str(run_end)})
    outputData['success_data'].append({'motifs_found': innerList}) # Appends the list populated above to the output data

# Function that takes in a fasta string, extracts the accession code and the sequence
def get_fasta_sequence(fasta_code):
    sequence = str(fasta_code) # Type casts to ensure the object dealt with is a string
    fastaSplit = sequence.splitlines() #Takes out the new line characters
    fastaAccessionCode = get_SPaccession_from_fasta(fasta_code) #Obtaining the accession code from fasta string
    get_protein_name(fastaAccessionCode) #Calling the function to append protein name to output JSON
    fastaSplit = fastaSplit[1:] # Removes header line (takes line 1 onwards to the end of the file)
    sequence = "".join(fastaSplit)
    sequence = sequence.replace("'", "") # Cleaning up any stray characters not suitable for the protein sequence
    outputData['success_data'].append({'full_sequence':sequence}) #Append sequence to output JSON for use on webpage
    return sequence


# Function that deals with the batch input of Uniprot accession codes_list
def get_batch_sequence(accession_codes):
    codes_list = accession_codes.split() # takes the inputted codes, splits them and adds them to list
    sequences_list = [] # List that will hold each of the sequences from inputted accessions
    index = 0; #Counter used to keep track of which sequence from the sequences_list to pass
    outerList = []
    for item in codes_list:
        try:
            motifFoundList = [] # Empty list to remove previous items data
            #Gaining the sequences from SwissprotDB using accession codes
            handle = ExPASy.get_sprot_raw(item)
            record = SwissProt.read(handle)
            handle.close()
            sequences_list.append(record.sequence) # Appends the current item in the iteration to the list
        except:
            outputData['error_data'].append(item) # If there are any invalid accession codes input, add them to the error data
            index -= 1 #Decrement as there is one less accession code and I increment later
        #Finds the motifs for each
        iterObject = re.finditer(r"(?=([^P][^PKRHW][VLSWFNQ][ILTYWFN][FIY][^PKRH]))", sequences_list[index]) # Current sequence in the list is iterated through using findIter (Motif overalp included)
        for match in iterObject:
            run_start = match.start()+1
            run_end = match.end()+6 #Need to add six here because .end() function breaks when using motif overlap regex
            #Appends each of the matches found to the Dictionary, including start_pos, sequence and
            motifFoundList.append({'start_pos': str(run_start), 'sequence_found' : match.group(1), 'end_pos' : str(run_end)})
        outerList.append({'protein_name':record.entry_name, 'full_sequence':record.sequence, 'motifs_found':motifFoundList}) # Appends data obtained through the inner for loop to motifFoundList
        index += 1 # Increment index
    outputData['success_data'].append(outerList) # Appends the list populated in the nested for loop to the output JSON object




# If statements dealing with which functions to call depending on the users input (program flow control)

# Variables for easy access of the fasta and accession code input
inputtedAccession = jsonInputDict['inputData'][0]['accession']
inputtedFasta = jsonInputDict['inputData'][0]['fasta']

# Checks whether the batch flag is present in the input data, BATCH is sent as a value to 'fasta' key in the ajax JSON file when batch input is required
if inputtedFasta == "BATCH":
    get_batch_sequence(inputtedAccession) # Call batch input function
# When user enters into both input boxes, use the accession code functions
elif inputtedAccession != "null" and inputtedFasta != "null":
    protein_sequence = get_sequence(inputtedAccession) # Gets the seqeunce using the get_sequence() function
    get_linear_motifs(protein_sequence) # Calls the get motifs method which builds the outputData JSON string
# When user enters in fasta format and not accession code, use fasta functions
elif inputtedAccession == "null" and inputtedFasta != "null":
    protein_sequence = get_fasta_sequence(inputtedFasta) # Gets the sequence using the fasta_get_sequence() function
    get_linear_motifs(protein_sequence) # Calls the get motifs method which builds the outputData JSON string
# When user enters into accession input, use the accession code functions
elif inputtedFasta == "null" and inputtedAccession != "null":
    protein_sequence = get_sequence(inputtedAccession) # Gets the seqeunce using the get_sequence() function
    get_linear_motifs(protein_sequence) # Calls the get motifs method which builds the outputData JSON string



#Prints the final object back to the webpage in JSON data format
print(json.dumps(outputData))
