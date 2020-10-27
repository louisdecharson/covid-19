#!/bin/bash/python
"""
Created on Mon Jul 20 13:20:18 2020

Description: Download covid related data from data.gouv.fr 
"""
import requests
from typing import Dict, List, Any
import pandas as pd
import numpy as np

# ============================================================================ #

NAME_DATASET = "sursaud-corona-quot-reg"
SLUG_DATASET = "5e74ecf52eb7514f2d3b8845"
URL_DATASET = "https://www.data.gouv.fr/api/1/datasets/{}/".format(SLUG_DATASET)

COLUMNS_MAPPING = {
    "date_de_passage":"Day",
    # "reg": "Region",
    # "sursaud_cl_age_corona": "Age group",
    "nbre_pass_corona": "Urgent care attendances for suspicion of COVID-19",
    "nbre_pass_tot": "Total urgent care attendances",
    "nbre_hospit_corona": "Hospitalizations for suspicion of COVID-19",
    "nbre_acte_corona": "Medical acts (SOS Médecin) for suspicion of COVID-19",
    "nbre_acte_tot": "Medical acts total (SOS Médecin)"
}
OUT_RAW_FILE = "sursaud_corona_raw.csv"
OUT_PROCESSED_FILE = "sursaud_corona.csv"

# ============================================================================ #


class RequestError(Exception):
    pass
class FormatError(Exception):
    pass
class ResourceNotFound(Exception):
    pass
# ============================================================================ #


def download_data() -> None:
    """Download SOS Medecins data from data-gouv.
    
    1. Retrieve the list of datasets
    2. From the list of dataset, retrieve the one with data at the national
       level and save it locally.
    
    """
    datasets = retrieve_datasets()
    hospit_dataset = filter(lambda x: True if NAME_DATASET in x["title"] else False,
                            datasets)
    if len(hospit_dataset) == 1:
        url_data = hospit_dataset[0]["url"]
    else:
        raise ResourceNotFound(f"Dataset {NAME_DATASET} cannot be found in datasets at {URL_DATASET}")
    download_csv(url_data)

    # Process data
    df = process_data(OUT_RAW_FILE)
    df.to_csv(OUT_PROCESSED_FILE, index=None)
    print("{} saved to disk.".format(OUT_PROCESSED_FILE))

def process_data(filepath: str) -> pd.DataFrame:
    # Read the csv file
    df = pd.read_csv(filepath, sep=";")

    # group = ["Age group", "Region", "Day"]
    group = ["Day"]
    # Select the columns
    df = df[list(COLUMNS_MAPPING.keys())]
    df.rename(columns=COLUMNS_MAPPING, inplace=True)

    df_total = df.groupby(group).sum().reset_index()
    
    # Wide to long
    df_long = pd.melt(df_total,
                      id_vars=group,
                      value_vars=[c for c in df_total.columns
                                  if c not in group],
                      var_name = 'Category')
    return df_long


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


def download_csv(url: str, name: str = OUT_RAW_FILE) -> None:
    """Download a csv file at url and save it.
    
    Args:
        url: url of the csv file to download
        name: name of the csv of local drive

    Raises:
        RequestError if GET requests' status code is different from 200
    """
    r = requests.get(url)
    if r.status_code == 200:
        print("Download {}".format(url.split("/")[-1]))
        with open(name, "wb") as f:
            f.write(r.content)
            print("{} saved to disk.".format(name))
    else:
        raise RequestError("Error {} during download.".format(r.status_code))


# ============================================================================ #

if __name__ == "__main__":
    download_data()
