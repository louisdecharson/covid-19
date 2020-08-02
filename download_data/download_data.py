#!/bin/bash/python
"""
Created on Mon Jul 20 13:20:18 2020

Description: Download covid related data from data.gouv.fr 
"""
import requests
from typing import Dict, List, Any

SLUG_DATASET = "5e74ecf52eb7514f2d3b8845"
URL_DATASET = "https://www.data.gouv.fr/api/1/datasets/{}/".format(SLUG_DATASET)

# ============================================================================ #


class RequestError(Exception):
    pass


class FormatError(Exception):
    pass


# ============================================================================ #


def download_data():
    """Download SOS Medecins data from data-gouv.
    
    1. Retrieve the list of datasets
    2. From the list of dataset, retrieve the one with data at the national
       level and save it locally.
    
    """
    datasets = retrieve_datasets()
    url_data = [d["url"] for d in datasets if "france.csv" in d["title"]][0]
    download_csv(url_data)


def retrieve_datasets() -> List[Dict[str, str]]:
    """Retrieve the list of sub-datasets.
    
    Returns:
        the list of resources as a list of dictionaries
    Raises:
        RequestError in case GET request status_code is not 200
        
    """
    r = requests.get(URL_DATASET)
    if r.status_code != 200:
        raise RequestError(
            "Error {} during retrieval of datasets".format(r.status_code)
        )
    r_json = r.json()
    if "resources" not in r_json.keys():
        raise FormatError(
            "Error in JSON format of {}, key 'resources' is missing among {}".format(
                SLUG_DATASET, r_json.keys()
            )
        )
    return r_json["resources"]


def download_csv(url: str, name: str = "sursaud_corona.csv") -> None:
    """Download a csv file at url and save it.
    
    Args:
        url: url of the csv file to download
        name: name of the csv of local drive

    Raises:
        RequestError if GET requests' status code is different from 200
    """
    r = requests.get(url)
    if r.status_code == 200:
        with open(name, "wb") as f:
            f.write(r.content)
            print("Download {}, saved as {}".format(url.split("/")[-1], name))
    else:
        raise RequestError("Error {} during download.".format(r.status_code))


# ============================================================================ #

if __name__ == "__main__":
    download_data()
