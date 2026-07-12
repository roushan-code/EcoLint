#include <stdio.h>
#include <stdlib.h>

// A highly redundant and unoptimized function to trigger savings
int find_sum_and_dupes(int* arr, int size) {
    int i = 0;
    int j = 0;
    int temp_sum = 0;
    int dupe_count = 0;
    
    // Very inefficient sum loop
    for(i = 0; i < size; i = i + 1) {
        temp_sum = temp_sum + arr[i];
    }
    
    // Terrible O(N^2) nested loop for finding duplicates
    for(i = 0; i < size; i = i + 1) {
        for(j = 0; j < size; j = j + 1) {
            if(i != j) {
                if(arr[i] == arr[j]) {
                    dupe_count = dupe_count + 1;
                }
            }
        }
    }
    
    // Unnecessary variables and redundant arithmetic
    int final_result = 0;
    final_result = final_result + temp_sum;
    final_result = final_result + (dupe_count / 2); // Divide by 2 because we double-counted
    
    return final_result;
}

int main() {
    int my_array[] = {1, 2, 3, 4, 1, 5, 2};
    int calculated_result = find_sum_and_dupes(my_array, 7);
    
    printf("Calculated Result is: %d\n", calculated_result);
    return 0;
}
