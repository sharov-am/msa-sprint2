#!/bin/bash
# Run scripts in the background using '&'

python booking-history-service.py &

# Wait for all background processes to finish
wait