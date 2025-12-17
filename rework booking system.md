# rework booking system
the slots follows the config(price,availabilty)
    1) it owns config
    2) weekly config stored in config table

there will not be normal time slots without booking
time slots are generated 
    1) when any booking is occurred for that time period
    2) when specific slot is edited to be created

so when time slots are requested in list available slots api
    1) get config for that week 
    2) check if any time slots exist for that week replace with existing time slots
        note: so that any edited slots are reflected and dont send booked slots
    3) return the available slots

for booking a slot
    1) check if slot exists
        a) if exists check if available
            i) if available book it
            ii) else return not available
        b) if not exists create slot from config and book it

    
    