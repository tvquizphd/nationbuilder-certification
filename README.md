## Running nationbuilder API demo

Install anaconda [on Linux](https://docs.anaconda.com/anaconda/install/linux/), [on MacOS](https://docs.anaconda.com/anaconda/install/mac-os/), or [on Windows](https://docs.anaconda.com/anaconda/install/windows/).

```
conda env create -f environment.yaml
conda activate nationbuilder-certification
```

### Run demo

```
python test.py https://example.app API_CLIENT_ID API_CLIENT_SECRET
```

To test locally without credentials,

```
python test.py -L
```
