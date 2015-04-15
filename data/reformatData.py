#reformatData.py

import urllib2
import re
import math

#string formatters
def sumHeaderLen(array, index):
	return sum(array[0:index])

def yearStr( intYear ):
	return "%04d" % intYear

def monthStr( intMonth ):
	return "%02d" % intMonth

#Date info
minYear = 2005
maxYear = 2015
currentMonth = 1
currentYear = 2015
maxDays = 31
maxMonths = 12

#num characters alotted for value per header
hLen = [6,8,7,6,6,32,27,6,0,0] 	#add year,month
yearIndex = (len(hlen)-1)-1
monthIndex = (len(hlen)-1)

#Headers
headers = ["latitude", "longitude", "coop", "id", "state", "station", "county", "elevation"]
headers = headers + ["year"] + ["month"] + ["day" + str(day+1) for day in range(maxDays)]
headerLine = "\t".join(str(h) for h in headers) + '\n'

#Data types
dataTypes = ["snfl", "sndpth"]

#Reformatting
for dataType in dataTypes:
	print dataType

	f = open( dataType + '.tsv', 'w')
	f.write(headerLine)

	for currentYear in range(minYear, maxYear+1):
		print currentYear
		for currentMonth in range(1, maxMonths+1):
			#URL to fetch data
			current_url = ("http://www1.ncdc.noaa.gov/pub/data/snowmonitoring/fema/" + 
						  monthStr(currentMonth) + "-" + yearStr(currentYear) + "-dly" + dataType + ".txt")

			#Error or not
			try:
				data = urllib2.urlopen(current_url)
			except:
				continue

			#reponse
			readlines = data.readlines()

			for line in readlines:
				#ignore unnecessary lines
				if (line.startswith('\n')):		continue #ignore newlines
				if (line.startswith('State')):	continue #ignore state
				if (line.startswith('   Lat')):	continue #ignore header

				#read in line
				currentLine = line[0:len(data.readline())-1]
				
				#vars
				numDays = (len(currentLine) - sumHeaderLen(hLen,8)) / 11
				headerLength = hLen + maxDays*[11]
				dayDiff = maxDays - numDays

				#new line construction
				row = ""
				maxIter = len(hLen) + maxDays

				for h in range(maxIter):
					if h==0:
						value = currentLine[0:sumHeaderLen(headerLength,1)]
					elif (h==yearIndex):
						value = yearStr(currentYear)	#year
					elif (h==monthIndex):
						value = monthStr(currentMonth)	#month
					elif (h>= (len(hLen) + numDays)):
						value = "" # "pass" + str(h-len(hLen)+1)
					else:
						value = currentLine[sumHeaderLen(headerLength,h):sumHeaderLen(headerLength,h+1)]
					#Important: strip whitespace on both sides
					value = value.strip(' ')

					if (h!=maxIter-1):
						value = value + '\t'

					row += value

				f.write( row + '\n' )
	f.close()
	print "done " + dataType

print "done"
