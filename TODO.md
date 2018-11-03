# Build
- ADD state for generator to deal with async actions
  - Problem : an async response can arrive anytime with the machine in any state
  ! so, we need additional transitions in the machine making up for that 
  - a possibility by the way is to configure the machine to throw if an event arrives in a state 
  it should not, but that still should not work - could receive the wrong response in the right 
  state
  - then those extra transitions must decide if they can be taken - typically a response can only
   come after a request, so the gen must keep a log of request, decide if there is a response 
   corresponding to a request which can be generated, updates the log, output the response if any
   . That is a reducing logic (or two) on the generator state.
     - initial generator state
     - extra field with generator updates (delta) in same format than the machine
     - and while I am doing that see if I can apply some transducer to this
     - name : system state? generator state correspond to the necessity to keep track of the 
     state of external system (no request, request received, response sent, etc. )
       - or external state?
! change build for run build, 'babel' is not recognized as an internal or external command,..

# Exotic searches
- store : empty, add, takeAndRemoveOne, isEmpty
- searches for path which satisfy a given content-based predicate
  - who have a given prefix
  - who have a given set of prefixes
- searches with order following some rules (instead of picking the first one in store)
  - random picking (following a given distribution law)
  - specifying distribution law may require extra configuration, at store creation time, or 
  included inside the vertex or edge (rather avoid for user-friendly API reason?)...
- searches which exclude some paths
  - may require modifying isEmpty

## Searches for path which satisfy a given content-based predicate
- empty : could change depending on the container we choose
  - array
  - prefix tree, radix tree etc
- add : only add those paths who satisfy a given predicate
  - filter :: Predicate -> Array<Path> -> Array<Path> (look it up in hoogle - curiosity)
  - add :: Array<Path> -> Store<Path> -> Store<Path>
- takeAndRemoveOne : picking strategy ( :: Store<P> -> {popped, newStore: Store<P>} )
  - be careful that elements who will never be picked have to be removed, so empty works as intended
    - that should be already taken care of by `add`?
    - but edge case if we have distribution law with 0% probability!!
    - in that case we need a remove function too, or a filter function!! forbid 0% prob? or 
    modify empty? tha would break law m + empty = m! modify add! so add membership policy to store
  - random(distribution law)
    - but distribution law based on what? length of paths? index of path in store? content of path?
    - for instance favor error paths? loops? control state?
      - requires a function to assign paths into categories and picking strategies between 
      category, then within a category yet another picking strategy...
      - NO!! leave that to the picking function interface
    - any random picking strategy will require random generator
  - so interface is necessary
    - random generator<MIN, MAX> :: () -> RandomNumber between MIN and MAX
    - picking function :: RandomNumber -> Array<Path> -> Path
      - but actually does not have to be an array, could be a prefix tree, or any monoidal 
      traversable container:
      -  :: RandomNumber -> Store<Path> -> Path

## refactor
as graph -> store iteration -> transducer -> output aggregation?
in which case there may no longer be a need for generator!!
