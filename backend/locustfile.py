"""Load testing script for the website using Locust."""
# ruff: noqa: UP017

import random
from datetime import datetime, timezone

from locust import HttpUser, between, task

UTC = timezone.utc


def generate_payload():
    """Generate a random payload for measurement submission.

    Returns
    -------
    Json
        A JSON object containing the measurement data
    """
    return {
        "local_date": "2025-05-25",
        "local_time": "14:30:00",
        "location": {
            "type": "Point",
            "coordinates": [random.uniform(-180, 180), random.uniform(-90, 90)],
        },
        "water_source": "well",
        "temperature": {
            "sensor": "thermometer",
            "value": round(random.uniform(0, 50), 1),
            "time_waited": "00:01:15",
        },
    }


def submit_measurement(user):
    """Submit a measurement to the database.

    Attributes
    ----------
    user : HttpUser
        The HTTP user instance that will submit the measurement
    """
    user.client.post(
        "/api/measurements/", json=generate_payload(), headers={"X-CSRFToken": user.client.cookies.get("csrftoken")}
    )


def login(user, username, password):
    """Log in a user to the system.

    Attributes
    ----------
    user : HttpUser
        The HTTP user instance that will submit the measurement
    username : String
        The username of the user to log in
    password : String
        The password of the user to log in
    """
    user.client.post(
        "/api/login/",
        json={"username": username, "password": password},
        headers={"Content-Type": "application/json", "X-CSRFToken": user.client.cookies.get("csrftoken")},
    )


class TravelerUser(HttpUser):
    """Simulate a user who navigates the website and submits measurements erratically.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    """

    wait_time = between(1, 10)
    weight = 40

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/session/")

    @task
    def go_to_map(self):
        """Make a call to go to the map page.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/")

    @task
    def go_to_tutorial(self):
        """Make a call to go to the tutorial page.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/tutorial/")

    @task
    def go_to_export_page(self):
        """Make a call to go to the export page.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/export/")

    @task
    def go_to_about_page(self):
        """Make a call to go to the about page.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/about/")

    @task
    def go_to_contact_page(self):
        """Make a call to go to the contact page.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/contact/")

    @task
    def submit_a_measurement(self):
        """Make a call to submit a measurement.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        submit_measurement(self)

    @task
    def attempt_login(self):
        """Make a call to go to login.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        login(self, "researcher", "researcher")


class WebsiteSubmitter(HttpUser):
    """Simulate a user who submits measurements to the website.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    tasks : list
        The list of tasks this user will perform
    """

    wait_time = between(6, 60)
    weight = 90
    tasks = [submit_measurement]

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/session/")


class DataAnalysisUser(HttpUser):
    """Simulate a user who retrieves aggregated measurements for data analysis.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    """

    wait_time = between(4, 8)
    weight = 75

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/session/")

    @task
    def get_aggregated_measurements(self):
        """Make a call to retrieve aggregated measurements.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/measurements/aggregated/")


class CampaignsGetter(HttpUser):
    """Simulate the website retrieving active campaigns.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    """

    wait_time = between(6, 60)
    weight = 90

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/session/")

    @task
    def get_active_campaigns(self):
        """Make a call to retrieve active campaigns.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get(
            "/api/campaigns/active/",
            params={"datetime": datetime(2025, 5, 14, 10, 30, tzinfo=UTC).isoformat(), "lat": 0.5, "lng": 0.5},
        )


class APISubmitter(HttpUser):
    """Simulate a user who submits measurements via the API.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    tasks : list
        The list of tasks this user will perform
    """

    wait_time = between(0.3, 0.7)
    weight = 10
    tasks = [submit_measurement]

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/session/")


class LoginUser(HttpUser):
    """Simulate a user who tries to log in.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    """

    wait_time = between(1, 3)
    weight = 5

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.get("/api/session/")

    @task
    def try_to_log_in(self):
        """Make a call to attempt to log in.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        login(self, "researcher", "researcher")


class ResearcherUser(HttpUser):
    """Simulate a researcher who downloads data and searches for specific measurements.

    Attributes
    ----------
    wait_time : WaitTime
        The time to wait between tasks
    weight : int
        The weight of this user type in the load test
    """

    wait_time = between(60, 120)
    weight = 5

    def on_start(self):
        """Call once when a simulated user starts.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        login(self, "researcher", "researcher")

    @task(1)
    def download_data(self):
        """Make a call to download data in CSV format.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.post(
            "/api/measurements/search/",
            json={"format": "csv"},
            headers={"Content-Type": "application/json", "X-CSRFToken": self.client.cookies.get("csrftoken")},
        )

    @task(2)
    def search_for_data(self):
        """Make a call to search for measurements in Europe.

        Attributes
        ----------
        self : HttpUser
            The HTTP user instance
        """
        self.client.post(
            "/api/measurements/search/",
            json={
                "location[continents]": ["Europe"],
            },
            headers={"Content-Type": "application/json", "X-CSRFToken": self.client.cookies.get("csrftoken")},
        )
