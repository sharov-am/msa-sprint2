import grpc
from concurrent import futures
import booking_pb2
import booking_pb2_grpc
import uuid
from datetime import datetime
from typing import Any, List, Dict
from kafka_consumer import KafkaConsumerService
import logging

logging.basicConfig(
    level=logging.INFO, # Set the minimum level to log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s - %(levelname)s - %(message)s', # Define the output format
    datefmt='%Y-%m-%d %H:%M:%S' # Define the timestamp format
)

if __name__ == '__main__':
    
    
    def handler(val:Dict[str, Any]):
         logging.info(f"List bookings request {val}")
    
    consumer = KafkaConsumerService()
    
    consumer.consume_bookings(handler)