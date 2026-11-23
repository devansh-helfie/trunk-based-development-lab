# Changelog

## [3.1.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/3.0.0...3.1.0) (2026-11-23)


### Features

* PLT-1672 require a release PR for successful preparation ([#52](https://github.com/devansh-helfie/trunk-based-development-lab/issues/52)) ([977014d](https://github.com/devansh-helfie/trunk-based-development-lab/commit/977014dbfc6ba785fbcb7368f81831fd358bf49c))
* PLT-1672 reuse existing stable tags across prefix transition ([#38](https://github.com/devansh-helfie/trunk-based-development-lab/issues/38)) ([42138b4](https://github.com/devansh-helfie/trunk-based-development-lab/commit/42138b4acc1bc0c38c89e643a6bf2ac3d4db1635))
* PLT-1672 simplify retrospective releases without DEV history ([#48](https://github.com/devansh-helfie/trunk-based-development-lab/issues/48)) ([59cfdc0](https://github.com/devansh-helfie/trunk-based-development-lab/commit/59cfdc04e262bd7878a671f6705b0bc1e3bf854b))
* PLT-1672 skip already-tagged sources and handle no release changes ([#45](https://github.com/devansh-helfie/trunk-based-development-lab/issues/45)) ([3cfdf6c](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3cfdf6c33c295cc509ff7f206d2a78c26529a273))
* PLT-1672 validate historical sources before retrospective releases ([#47](https://github.com/devansh-helfie/trunk-based-development-lab/issues/47)) ([da34884](https://github.com/devansh-helfie/trunk-based-development-lab/commit/da348847aeacd97887a6179af3e701a0670d2a76))
* **version:** Update version from 2.0.0 to 3.0.0 ([#54](https://github.com/devansh-helfie/trunk-based-development-lab/issues/54)) ([3c03e16](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3c03e1626f3d1f4e63e99df2fd328f128a7f3d55))
* **vscode:** Add .vscode to .dockerignore ([#50](https://github.com/devansh-helfie/trunk-based-development-lab/issues/50)) ([8c6f4ca](https://github.com/devansh-helfie/trunk-based-development-lab/commit/8c6f4ca82ecee22573ba4020f8dbf7d9552cc95d))
* **vscode:** Remove .vscode from .gitignore ([#43](https://github.com/devansh-helfie/trunk-based-development-lab/issues/43)) ([3831a0f](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3831a0f0b4d0e7018b076cdbd73013463c97004f))

## [2.0.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/1.0.0...2.0.0) (2026-11-23)


### ⚠ BREAKING CHANGES

* PLT-1652 rename healthy status in health response ([#10](https://github.com/devansh-helfie/trunk-based-development-lab/issues/10))

### Features

* PLT-1652 add demo homepage and fix dev login ([826d02a](https://github.com/devansh-helfie/trunk-based-development-lab/commit/826d02ac9e84e549835b80a38c34224073c5f4e6))
* PLT-1652 add release history navigation ([#24](https://github.com/devansh-helfie/trunk-based-development-lab/issues/24)) ([0766792](https://github.com/devansh-helfie/trunk-based-development-lab/commit/07667923564f2758f60c863fd59ef92475757003))
* PLT-1652 add TEST deployment history navigation ([#29](https://github.com/devansh-helfie/trunk-based-development-lab/issues/29)) ([251d434](https://github.com/devansh-helfie/trunk-based-development-lab/commit/251d43472755ac11201ec0c09a5dec64bbbe4288))
* PLT-1652 rename healthy status in health response ([#10](https://github.com/devansh-helfie/trunk-based-development-lab/issues/10)) ([647d37f](https://github.com/devansh-helfie/trunk-based-development-lab/commit/647d37fdaaf0fd7225d5bd6b72945f72a1dc7e1f))
* PLT-1652 show image and configuration identities ([#18](https://github.com/devansh-helfie/trunk-based-development-lab/issues/18)) ([d758621](https://github.com/devansh-helfie/trunk-based-development-lab/commit/d758621f3b0c27dbc622268a9ff3f5ad468080a0))
* PLT-1672 allow stable releases to become Latest ([#33](https://github.com/devansh-helfie/trunk-based-development-lab/issues/33)) ([72e1e52](https://github.com/devansh-helfie/trunk-based-development-lab/commit/72e1e52ad0d127cb8db259008d2300f9655ca840))
* PLT-1672 remove prefix from newly generated release tags ([#36](https://github.com/devansh-helfie/trunk-based-development-lab/issues/36)) ([d8facc3](https://github.com/devansh-helfie/trunk-based-development-lab/commit/d8facc31519c42dfd532e7bf76dcbbeebc69ea33))
* PLT-1672 require a release PR for successful preparation ([#52](https://github.com/devansh-helfie/trunk-based-development-lab/issues/52)) ([977014d](https://github.com/devansh-helfie/trunk-based-development-lab/commit/977014dbfc6ba785fbcb7368f81831fd358bf49c))
* PLT-1672 reuse existing stable tags across prefix transition ([#38](https://github.com/devansh-helfie/trunk-based-development-lab/issues/38)) ([42138b4](https://github.com/devansh-helfie/trunk-based-development-lab/commit/42138b4acc1bc0c38c89e643a6bf2ac3d4db1635))
* PLT-1672 simplify retrospective releases without DEV history ([#48](https://github.com/devansh-helfie/trunk-based-development-lab/issues/48)) ([59cfdc0](https://github.com/devansh-helfie/trunk-based-development-lab/commit/59cfdc04e262bd7878a671f6705b0bc1e3bf854b))
* PLT-1672 skip already-tagged sources and handle no release changes ([#45](https://github.com/devansh-helfie/trunk-based-development-lab/issues/45)) ([3cfdf6c](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3cfdf6c33c295cc509ff7f206d2a78c26529a273))
* PLT-1672 validate historical sources before retrospective releases ([#47](https://github.com/devansh-helfie/trunk-based-development-lab/issues/47)) ([da34884](https://github.com/devansh-helfie/trunk-based-development-lab/commit/da348847aeacd97887a6179af3e701a0670d2a76))
* **vscode:** Add .vscode to .dockerignore ([#50](https://github.com/devansh-helfie/trunk-based-development-lab/issues/50)) ([8c6f4ca](https://github.com/devansh-helfie/trunk-based-development-lab/commit/8c6f4ca82ecee22573ba4020f8dbf7d9552cc95d))
* **vscode:** Remove .vscode from .gitignore ([#43](https://github.com/devansh-helfie/trunk-based-development-lab/issues/43)) ([3831a0f](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3831a0f0b4d0e7018b076cdbd73013463c97004f))


### Bug Fixes

* PLT-1652 grant release publication pr permissions ([3b7e64e](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3b7e64e2cafb4a072f9ed20ebbe09e069e9c0764))
* PLT-1652 restore compose access for dev runner ([111be80](https://github.com/devansh-helfie/trunk-based-development-lab/commit/111be808fe51ad14f66e80da9bf18a8a58377677))
* PLT-1652 retain release metadata after checkout ([fd18621](https://github.com/devansh-helfie/trunk-based-development-lab/commit/fd1862185f6a0856d70c5ce93e56ce15802e3d28))
* PLT-1652 trim release tag input before deployment ([#26](https://github.com/devansh-helfie/trunk-based-development-lab/issues/26)) ([34f4f91](https://github.com/devansh-helfie/trunk-based-development-lab/commit/34f4f91a6ccb7b746d6d07f0f9193f28b671c846))
* **ui:** PLT-1652 clarify package version and release details ([#17](https://github.com/devansh-helfie/trunk-based-development-lab/issues/17)) ([429639e](https://github.com/devansh-helfie/trunk-based-development-lab/commit/429639ee161bd33c800db3b70e908a2856d45c4f))

## [1.0.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/0.5.0...1.0.0) (2026-11-23)


### ⚠ BREAKING CHANGES

* PLT-1652 rename healthy status in health response ([#10](https://github.com/devansh-helfie/trunk-based-development-lab/issues/10))

### Features

* PLT-1652 add demo homepage and fix dev login ([826d02a](https://github.com/devansh-helfie/trunk-based-development-lab/commit/826d02ac9e84e549835b80a38c34224073c5f4e6))
* PLT-1652 add release history navigation ([#24](https://github.com/devansh-helfie/trunk-based-development-lab/issues/24)) ([0766792](https://github.com/devansh-helfie/trunk-based-development-lab/commit/07667923564f2758f60c863fd59ef92475757003))
* PLT-1652 add TEST deployment history navigation ([#29](https://github.com/devansh-helfie/trunk-based-development-lab/issues/29)) ([251d434](https://github.com/devansh-helfie/trunk-based-development-lab/commit/251d43472755ac11201ec0c09a5dec64bbbe4288))
* PLT-1652 rename healthy status in health response ([#10](https://github.com/devansh-helfie/trunk-based-development-lab/issues/10)) ([647d37f](https://github.com/devansh-helfie/trunk-based-development-lab/commit/647d37fdaaf0fd7225d5bd6b72945f72a1dc7e1f))
* PLT-1652 show image and configuration identities ([#18](https://github.com/devansh-helfie/trunk-based-development-lab/issues/18)) ([d758621](https://github.com/devansh-helfie/trunk-based-development-lab/commit/d758621f3b0c27dbc622268a9ff3f5ad468080a0))
* PLT-1672 allow stable releases to become Latest ([#33](https://github.com/devansh-helfie/trunk-based-development-lab/issues/33)) ([72e1e52](https://github.com/devansh-helfie/trunk-based-development-lab/commit/72e1e52ad0d127cb8db259008d2300f9655ca840))
* PLT-1672 remove prefix from newly generated release tags ([#36](https://github.com/devansh-helfie/trunk-based-development-lab/issues/36)) ([d8facc3](https://github.com/devansh-helfie/trunk-based-development-lab/commit/d8facc31519c42dfd532e7bf76dcbbeebc69ea33))
* PLT-1672 reuse existing stable tags across prefix transition ([#38](https://github.com/devansh-helfie/trunk-based-development-lab/issues/38)) ([42138b4](https://github.com/devansh-helfie/trunk-based-development-lab/commit/42138b4acc1bc0c38c89e643a6bf2ac3d4db1635))
* PLT-1672 simplify retrospective releases without DEV history ([#48](https://github.com/devansh-helfie/trunk-based-development-lab/issues/48)) ([59cfdc0](https://github.com/devansh-helfie/trunk-based-development-lab/commit/59cfdc04e262bd7878a671f6705b0bc1e3bf854b))
* PLT-1672 skip already-tagged sources and handle no release changes ([#45](https://github.com/devansh-helfie/trunk-based-development-lab/issues/45)) ([3cfdf6c](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3cfdf6c33c295cc509ff7f206d2a78c26529a273))
* PLT-1672 validate historical sources before retrospective releases ([#47](https://github.com/devansh-helfie/trunk-based-development-lab/issues/47)) ([da34884](https://github.com/devansh-helfie/trunk-based-development-lab/commit/da348847aeacd97887a6179af3e701a0670d2a76))
* **vscode:** Add .vscode to .dockerignore ([#50](https://github.com/devansh-helfie/trunk-based-development-lab/issues/50)) ([8c6f4ca](https://github.com/devansh-helfie/trunk-based-development-lab/commit/8c6f4ca82ecee22573ba4020f8dbf7d9552cc95d))
* **vscode:** Remove .vscode from .gitignore ([#43](https://github.com/devansh-helfie/trunk-based-development-lab/issues/43)) ([3831a0f](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3831a0f0b4d0e7018b076cdbd73013463c97004f))


### Bug Fixes

* PLT-1652 grant release publication pr permissions ([3b7e64e](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3b7e64e2cafb4a072f9ed20ebbe09e069e9c0764))
* PLT-1652 restore compose access for dev runner ([111be80](https://github.com/devansh-helfie/trunk-based-development-lab/commit/111be808fe51ad14f66e80da9bf18a8a58377677))
* PLT-1652 retain release metadata after checkout ([fd18621](https://github.com/devansh-helfie/trunk-based-development-lab/commit/fd1862185f6a0856d70c5ce93e56ce15802e3d28))
* PLT-1652 trim release tag input before deployment ([#26](https://github.com/devansh-helfie/trunk-based-development-lab/issues/26)) ([34f4f91](https://github.com/devansh-helfie/trunk-based-development-lab/commit/34f4f91a6ccb7b746d6d07f0f9193f28b671c846))
* **ui:** PLT-1652 clarify package version and release details ([#17](https://github.com/devansh-helfie/trunk-based-development-lab/issues/17)) ([429639e](https://github.com/devansh-helfie/trunk-based-development-lab/commit/429639ee161bd33c800db3b70e908a2856d45c4f))

## [0.5.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/0.4.0...0.5.0) (2026-11-23)


### Features

* PLT-1672 simplify retrospective releases without DEV history ([#48](https://github.com/devansh-helfie/trunk-based-development-lab/issues/48)) ([59cfdc0](https://github.com/devansh-helfie/trunk-based-development-lab/commit/59cfdc04e262bd7878a671f6705b0bc1e3bf854b))
* PLT-1672 validate historical sources before retrospective releases ([#47](https://github.com/devansh-helfie/trunk-based-development-lab/issues/47)) ([da34884](https://github.com/devansh-helfie/trunk-based-development-lab/commit/da348847aeacd97887a6179af3e701a0670d2a76))

## [0.4.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/0.3.0...0.4.0) (2026-11-23)


### Features

* PLT-1672 skip already-tagged sources and handle no release changes ([#45](https://github.com/devansh-helfie/trunk-based-development-lab/issues/45)) ([3cfdf6c](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3cfdf6c33c295cc509ff7f206d2a78c26529a273))

## [0.3.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/0.2.0...0.3.0) (2026-11-23)


### Features

* **vscode:** Remove .vscode from .gitignore ([#43](https://github.com/devansh-helfie/trunk-based-development-lab/issues/43)) ([3831a0f](https://github.com/devansh-helfie/trunk-based-development-lab/commit/3831a0f0b4d0e7018b076cdbd73013463c97004f))

## [0.2.0](https://github.com/devansh-helfie/trunk-based-development-lab/compare/0.1.0...0.2.0) (2026-11-23)


### Features

* PLT-1672 reuse existing stable tags across prefix transition ([#38](https://github.com/devansh-helfie/trunk-based-development-lab/issues/38)) ([42138b4](https://github.com/devansh-helfie/trunk-based-development-lab/commit/42138b4acc1bc0c38c89e643a6bf2ac3d4db1635))

## Changelog

Release history starts from the fresh demo baseline `0.1.0`.
