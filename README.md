# M5: Distributed Execution Engine
> Full name: `<first last>`
> Email:  `<email@brown.edu>`
> Username:  `cslogin`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `2` new software components, totaling `376` added lines of code over the previous implementation. Key challenges included 
`1)The first key challenge was understanding the setup portion between the coordinator and the nodes. I struggled to understand what notify was. However, I resolved the problem with TA hours in which I realized notify could be seen as a concept. As a result I could embed my map,shuffle, and reduce phase in callbacks since each phase would require all the nodes to send a response from the methods before moving on to the next phase. 2)The next challenge was creating mr_routes without modify my original routes file. I created a new file that implemented similar route functionality as local.routes and a deregister. Within the node.js file I was able to look for instances the term mr was being utilized to call mr_routes instead of regular routes. 3) The next key challenge was in the shuffle phase. I struggled with race conditions because I initially tried tried a get than a put and some of the information would be erased as multiple gets would read an outdated file. To fix this I had to replace to store black box code with my code and create an append method. 4) I spent hours trying to implement append with initially trying to use readSync and writesync to get the current node data and then concat my new information which I would then write back to the file. However, after hours of race conditions I discovers the appendFileSync which avoided race conditions and could use the w flag to overwrite data with the concatanated version. 5) My last issue was after passing the first test the second test was formatted different. After some time think I realized I must alter the way I read the object in map and shuffle. I would have to handle the case where a single data entry has multiple values. This would be done through parsing the sub array if an array was detected.`.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*:
My code passed the gradescope tests. Additionally for my store.append method I wrote tests to ensure 2 objects with the same keys would be appended on the same file. This was performed by calling append in the same key and performing a store.get on the key. I additionally tested that two different keys wouldn't append to the same file by using the same process previously mentioed. I then tested 2 tests cases for my mem.append to ensure the I was appending to the correct file. Lastly I have 2 test cases that mimics to same tests that were done for store, but instead I manually input memory:true to the configuration.

*Performance*:
I tested the performance between using store and mem in exec utilizing the test suite in mr.test.js
           |  meme  |  store  |
all.mr:ncdc| 47.4042| 70.5906 |
________________________________
all.mr:dlib| 82.0001| 203.1130|
## Key Feature
> Which extra features did you implement and how?
-I implemented the In-memory operation by handling an extra paramter in configuration called memory. During the map phase I would perform store.get because it is necessary to read the initial information on nodes. However, after the inital store.get I create a variable called storeOrMem that changes based on if the configuration includes a memory paramter and the value is true. I would use this variable instead .store -> [storeOrMem]. Then I implemented the append function in mem which handles the same functionality in store.append. 

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `<25 hours>`

