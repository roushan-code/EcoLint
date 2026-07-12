# Memory-intensive Python code for EcoLint benchmarking
# This code allocates and manipulates large amounts of memory

import sys
import time
import random
import string

def generate_random_string(length):
    """Generate a random string of specified length"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def create_large_data_structures():
    """Create large in-memory data structures"""
    print("Creating large data structures...")
    
    # Create a large list with millions of elements
    large_list = []
    for i in range(1_000_000):
        large_list.append({
            'id': i,
            'name': generate_random_string(100),
            'data': [random.random() for _ in range(50)],
            'metadata': {
                'created': time.time(),
                'modified': time.time(),
                'tags': [generate_random_string(20) for _ in range(10)]
            }
        })
    
    return large_list

def process_data(data):
    """Process the data with multiple iterations"""
    print("Processing data...")
    
    results = []
    for item in data:
        # Perform various operations
        processed = {
            'id': item['id'],
            'name_upper': item['name'].upper(),
            'name_lower': item['name'].lower(),
            'data_sum': sum(item['data']),
            'data_avg': sum(item['data']) / len(item['data']),
            'data_max': max(item['data']),
            'data_min': min(item['data']),
            'metadata_copy': item['metadata'].copy(),
            'tags_length': len(item['metadata']['tags']),
            'tags_reversed': item['metadata']['tags'][::-1],
        }
        results.append(processed)
    
    return results

def create_nested_structures():
    """Create deeply nested data structures"""
    print("Creating nested structures...")
    
    nested = {}
    for i in range(1000):
        current = nested
        for j in range(50):
            if j not in current:
                current[j] = {}
            current = current[j]
        current['value'] = generate_random_string(1000)
    
    return nested

def main():
    print("Starting memory-intensive benchmark...")
    print(f"Python version: {sys.version}")
    
    start_time = time.time()
    
    # Create large data structures
    data = create_large_data_structures()
    print(f"Created {len(data)} items")
    
    # Process the data
    processed = process_data(data)
    print(f"Processed {len(processed)} items")
    
    # Create nested structures
    nested = create_nested_structures()
    print("Created nested structures")
    
    # Keep data in memory
    print(f"Total items in memory: {len(data) + len(processed)}")
    
    end_time = time.time()
    print(f"Total execution time: {end_time - start_time:.2f} seconds")
    print("Benchmark complete!")

if __name__ == "__main__":
    main()