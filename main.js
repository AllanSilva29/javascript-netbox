const HOST = "HOST_HERE";

const netboxApiURL = `http://${HOST}/api/`;
const token = "TOKEN_HERE";

(() => {
  const getDataInput = document.getElementById("input");
  getDataInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      getSite();
    }
  });
})();

const showOrHideSpinner = ({ show } = { show: true }) => {
  if (show) {
    const spinner = document.querySelector(".lds-spinner--hidden");
    spinner.classList.remove("lds-spinner--hidden");
    spinner.classList.add("lds-spinner");
  } else {
    const spinner = document.querySelector(".lds-spinner");
    spinner.classList.remove("lds-spinner");
    spinner.classList.add("lds-spinner--hidden");
  }
};

const showOrHideOutput = ({ show, text } = { show: true, text: "" }) => {
  const output = document.getElementById("output");
  if (show && text) {
    output.textContent = JSON.stringify(text, null, 2);
  } else {
    output.textContent = "";
  }
};

function getSite() {
  showOrHideSpinner({ show: true });
  showOrHideOutput({ show: false });

  const site = document.getElementById("input").value;

  axios
    .get(netboxApiURL + `dcim/sites/?q=${site}`, {
      headers: {
        Accept: "application/json; charset=utf-8; indent=4",
        Authorization: `Token ${token}`,
      },
    })
    .then((response) => {
      console.log(response.data);

      if (response.data.count > 1) {
        handleMultipleSites(response.data.results);
      } else {
        getDevices(response.data.results).then((devices) => {
          showOrHideSpinner({ show: false });
          showOrHideOutput({ show: true, text: devices });
        });
      }
    })
    .catch((error) => console.error("Error fetching data:", error));
}

function handleMultipleSites(sites) {
  const siteList = sites.map((site) => {
    return {
      name: site.name,
      id: site.id,
    };
  });

  getDevices(siteList).then((devices) => {
    showOrHideSpinner({ show: false });
    showOrHideOutput({ show: true, text: devices });
  });
}

async function getDevices(siteList) {
  const devices = [];

  await Promise.all(
    siteList.map(async (site) => {
      const response = await axios
        .get(netboxApiURL + `dcim/devices/?site_id=${site.id}`, {
          headers: {
            Accept: "application/json; charset=utf-8; indent=4",
            Authorization: `Token ${token}`,
          },
        })
        .catch((error) => console.error("Error fetching data:", error));
      return response.data;
    })
  ).then((data) => {
    data.forEach((result) => {
      devices.push({
        count: result.count,
        devices: result.results.map((device) => {
          return {
            name: device.name,
            id: device.id,
            site: device.site.display,
            primary_ip: device.primary_ip4,
          };
        }),
        results: result.results,
      });
    });

    console.log(devices);
  });

  return devices.length ? devices : "No devices found";
}
